import { Injectable, Logger, NotFoundException, BadRequestException, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import { Campaign, CampaignStatus, CampaignWave } from './schemas/campaign.schema';
import { CampaignRecipient } from './schemas/campaign-recipient.schema';
import { CampaignLog, LogEvent, LogLevel } from './schemas/campaign-log.schema';
import { DirectMessage } from './schemas/direct-message.schema';
import { Customer } from '../customers/schemas/customer.schema';
import { YCloudClient, YCloudError } from './ycloud.client';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { SendSingleDto } from './dto/send-single.dto';

const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 3;

const YCLOUD_ERROR_MESSAGES: Record<string, string> = {
  PARAM_INVALID: 'Caracteres inválidos',
  BALANCE_INSUFFICIENT: 'Fondos insuficientes',
};

function friendlyYCloudMessage(err: YCloudError): string {
  return YCLOUD_ERROR_MESSAGES[err.code] ?? err.message;
}

@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name);

  constructor(
    @InjectModel('Campaign')
    private readonly campaignModel: Model<Campaign>,
    @InjectModel('CampaignRecipient')
    private readonly recipientModel: Model<CampaignRecipient>,
    @InjectModel('CampaignLog')
    private readonly logModel: Model<CampaignLog>,
    @InjectModel('DirectMessage')
    private readonly directMessageModel: Model<DirectMessage>,
    @InjectModel('Customer')
    private readonly customerModel: Model<Customer>,
    private readonly ycloud: YCloudClient,
    private readonly config: ConfigService,
  ) {}

  // ─── Advisor → YCloud phoneNumberId ──────────────────────────────────────

  private resolvePhoneNumberId(siguiendo: string): string | null {
    const key = siguiendo?.toUpperCase();
    const map: Record<string, string> = {
      EZEQUIEL: this.config.get<string>('YCLOUD_PHONE_ID_EZEQUIEL', ''),
      DENIS: this.config.get<string>('YCLOUD_PHONE_ID_DENIS', ''),
      MARTIN: this.config.get<string>('YCLOUD_PHONE_ID_MARTIN', ''),
      JULIAN: this.config.get<string>('YCLOUD_PHONE_ID_JULIAN', ''),
    };
    const id = map[key];
    return id && id.trim().length > 0 ? id.trim() : null;
  }

  // ─── Normalización de teléfono a E.164 ───────────────────────────────────

  private normalizePhone(phone: string | undefined | null): string | null {
    if (!phone) return null;
    let clean = phone.replace(/[\s\-\(\)]/g, '');
    if (clean.startsWith('+549') && clean.length >= 13) return clean;
    if (clean.startsWith('549') && clean.length >= 12) return `+${clean}`;
    if (clean.startsWith('54') && clean.length >= 11) return `+${clean}`;
    if (clean.length >= 10 && !clean.startsWith('54')) return `+549${clean}`;
    return null;
  }

  // ─── Listado de templates ─────────────────────────────────────────────────

  async getTemplates() {
    const templates = await this.ycloud.listApprovedTemplates();

    // Reverse map: wabaId → advisor name
    const wabaToAdvisor: Record<string, string> = {};
    const advisors = [
      { key: 'YCLOUD_WABA_ID_EZEQUIEL', label: 'Ezequiel' },
      { key: 'YCLOUD_WABA_ID_DENIS', label: 'Denis' },
      { key: 'YCLOUD_WABA_ID_MARTIN', label: 'Martin' },
      { key: 'YCLOUD_WABA_ID_JULIAN', label: 'Julian' },
    ];
    for (const { key, label } of advisors) {
      const id = this.config.get<string>(key, '').trim();
      if (id) wabaToAdvisor[id] = label;
    }

    return templates.map((t) => ({
      ...t,
      channelLabel: wabaToAdvisor[t.wabaId] ?? null,
    }));
  }

  async getFilterOptions(): Promise<{ productos: string[] }> {
    const raw = await this.customerModel.distinct('producto');
    const productos = (raw as (string | null | undefined)[])
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      .sort((a, b) => a.localeCompare(b, 'es'));
    return { productos };
  }

  // ─── Preview de destinatarios (sin persistir) ─────────────────────────────

  private async buildPreviewItems(filter: { siguiendo?: string[]; estado?: string[]; producto?: string[] }) {
    const query: Record<string, any> = {};
    if (filter.siguiendo?.length) query['siguiendo'] = { $in: filter.siguiendo };
    if (filter.estado?.length) query['estado'] = { $in: filter.estado };
    if (filter.producto?.length) query['producto'] = { $in: filter.producto };

    const customers = await this.customerModel
      .find(query)
      .select('nombre apellido telefono siguiendo estado producto')
      .lean() as unknown as Customer[];

    return customers.map((customer) => {
      const phone = this.normalizePhone(customer.telefono);
      const siguiendo = customer.siguiendo ?? 'SIN_ASIGNAR';
      const phoneNumberId = this.resolvePhoneNumberId(siguiendo);
      const willSend = !!phone && !!phoneNumberId;

      let skipReason: string | undefined;
      if (!phone) skipReason = 'Sin teléfono válido';
      else if (!phoneNumberId) {
        skipReason = siguiendo === 'SIN_ASIGNAR'
          ? 'Sin asesor asignado'
          : `Sin canal YCloud para ${siguiendo}`;
      }

      return {
        customerId: String(customer._id),
        customerName: [customer.nombre, customer.apellido].filter(Boolean).join(' ') || '—',
        customerPhone: phone ?? customer.telefono ?? '',
        siguiendo,
        phoneNumberId: phoneNumberId ?? '',
        estado: customer.estado ?? '',
        producto: (customer as any).producto ?? '',
        willSend,
        skipReason,
      };
    });
  }

  async previewByFilter(filter: { siguiendo?: string[]; estado?: string[]; producto?: string[] }) {
    return this.buildPreviewItems(filter);
  }

  async previewCampaign(campaignId: string) {
    const campaign = await this.campaignModel.findById(campaignId);
    if (!campaign) throw new NotFoundException(`Campaña ${campaignId} no encontrada`);
    return this.buildPreviewItems({
      siguiendo: campaign.recipientFilter?.siguiendo,
      estado: campaign.recipientFilter?.estado,
      producto: (campaign.recipientFilter as any)?.producto,
    });
  }

  private async countEligibleWillSend(filter: {
    siguiendo?: string[];
    estado?: string[];
    producto?: string[];
  }): Promise<number> {
    const preview = await this.buildPreviewItems(filter);
    return preview.filter((p) => p.willSend).length;
  }

  private buildWaveDocuments(waves: { scheduledAt: Date; recipientCount: number }[]) {
    return waves.map((w, i) => ({
      waveNumber: i + 1,
      scheduledAt: w.scheduledAt,
      recipientCount: w.recipientCount,
      status: 'SCHEDULED' as const,
      sentCount: 0,
      failedCount: 0,
    }));
  }

  private async assertWavesMatchEligibleRecipients(
    waves: { scheduledAt: Date; recipientCount: number }[],
    filter: { siguiendo?: string[]; estado?: string[]; producto?: string[] },
  ): Promise<void> {
    if (!waves.length) {
      throw new BadRequestException('Debe definir al menos una oleada');
    }
    if (waves.length > 3) {
      throw new BadRequestException('Máximo 3 oleadas');
    }
    for (const w of waves) {
      if (!Number.isFinite(w.recipientCount) || w.recipientCount < 1) {
        throw new BadRequestException('Cada oleada debe tener al menos 1 destinatario');
      }
      if (Number.isNaN(w.scheduledAt.getTime())) {
        throw new BadRequestException('Fecha y hora de oleada inválida');
      }
    }
    const eligible = await this.countEligibleWillSend(filter);
    const sum = waves.reduce((s, w) => s + w.recipientCount, 0);
    if (eligible === 0) {
      throw new BadRequestException('No hay destinatarios elegibles para enviar con los filtros actuales');
    }
    if (sum !== eligible) {
      throw new BadRequestException(
        `La suma de destinatarios por oleada (${sum}) debe coincidir con los elegibles para envío (${eligible})`,
      );
    }
  }

  // ─── Envío puntual ────────────────────────────────────────────────────────

  async sendSingle(dto: SendSingleDto, userId: string): Promise<{ messageId: string; to: string }> {
    const phone = this.normalizePhone(dto.phone);
    if (!phone) {
      throw new BadRequestException(`Número de teléfono inválido: "${dto.phone}"`);
    }

    const phoneNumberId = this.resolvePhoneNumberId(dto.advisor);
    if (!phoneNumberId) {
      throw new BadRequestException(
        `No hay número de YCloud configurado para el asesor ${dto.advisor}`,
      );
    }

    try {
      const result = await this.ycloud.sendTemplateMessage({
        to: phone,
        phoneNumberId,
        templateName: dto.templateName,
        templateLanguage: dto.templateLanguage,
        headerImageUrl: dto.templateHeaderImageUrl,
      });

      await this.directMessageModel.create({
        phone,
        advisor: dto.advisor,
        templateName: dto.templateName,
        templateLanguage: dto.templateLanguage,
        yCloudMessageId: result.id,
        sentBy: userId,
      });

      this.logger.log(
        `Envío puntual → ${phone} (${dto.advisor}) plantilla "${dto.templateName}" — YCloud ID: ${result.id}`,
      );

      return { messageId: result.id, to: phone };
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof HttpException) throw err;
      const status = (err?.status >= 400) ? err.status : 500;
      const message: string = err?.message ?? 'Error al enviar el mensaje por YCloud';
      throw new HttpException(message, status);
    }
  }

  async getDirectMessages(): Promise<DirectMessage[]> {
    return this.directMessageModel.find().sort({ createdAt: -1 }).limit(200).exec();
  }

  // ─── CRUD campañas ────────────────────────────────────────────────────────

  async create(dto: CreateCampaignDto, userId: string): Promise<Campaign> {
    const recipientFilter = dto.recipientFilter ?? {};
    const filterForPreview = {
      siguiendo: recipientFilter.siguiendo,
      estado: recipientFilter.estado,
      producto: recipientFilter.producto,
    };

    let wavesDoc: CampaignWave[] | undefined;
    if (dto.waves?.length) {
      const parsed = dto.waves.map((w) => ({
        scheduledAt: new Date(w.scheduledAt),
        recipientCount: w.recipientCount,
      }));
      await this.assertWavesMatchEligibleRecipients(parsed, filterForPreview);
      wavesDoc = this.buildWaveDocuments(parsed);
    }

    const campaign = await this.campaignModel.create({
      name: dto.name,
      templateName: dto.templateName,
      templateLanguage: dto.templateLanguage,
      templateHeaderImageUrl: dto.templateHeaderImageUrl,
      recipientFilter,
      status: 'DRAFT',
      createdBy: userId,
      totalRecipients: 0,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      pendingCount: 0,
      ...(wavesDoc ? { waves: wavesDoc } : {}),
    });

    this.logger.log(`Campaign created: ${campaign._id.toString()} — "${dto.name}"`);
    return campaign;
  }

  async findAll(): Promise<Campaign[]> {
    return this.campaignModel.find().sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<Campaign> {
    const campaign = await this.campaignModel.findById(id).exec();
    if (!campaign) throw new NotFoundException(`Campaña ${id} no encontrada`);
    return campaign;
  }

  async getRecipients(campaignId: string): Promise<CampaignRecipient[]> {
    return this.recipientModel
      .find({ campaignId: new Types.ObjectId(campaignId) })
      .sort({ createdAt: 1 })
      .exec();
  }

  async retryRecipient(campaignId: string, recipientId: string): Promise<void> {
    const recipient = await this.recipientModel.findOne({
      _id: new Types.ObjectId(recipientId),
      campaignId: new Types.ObjectId(campaignId),
    });
    if (!recipient) throw new NotFoundException('Destinatario no encontrado');
    if (recipient.status !== 'FAILED') {
      throw new BadRequestException('Solo se pueden reintentar destinatarios en estado FAILED');
    }

    await this.recipientModel.updateOne(
      { _id: recipient._id },
      { $set: { status: 'PENDING', errorMessage: undefined, retryAfter: undefined, attempts: 0 } },
    );
    await this.campaignModel.updateOne(
      { _id: new Types.ObjectId(campaignId) },
      { $inc: { failedCount: -1, pendingCount: 1 } },
    );
  }

  async updateRecipientPhone(campaignId: string, recipientId: string, phone: string): Promise<void> {
    const recipient = await this.recipientModel.findOne({
      _id: new Types.ObjectId(recipientId),
      campaignId: new Types.ObjectId(campaignId),
    });
    if (!recipient) throw new NotFoundException('Destinatario no encontrado');
    if (recipient.status !== 'FAILED') {
      throw new BadRequestException('Solo se puede editar el teléfono de destinatarios en estado FAILED');
    }

    // Validación básica de formato E.164
    if (!/^\+\d{7,15}$/.test(phone)) {
      throw new BadRequestException('El número debe estar en formato E.164 (ej: +5491122334455)');
    }

    await this.recipientModel.updateOne(
      { _id: recipient._id },
      { $set: { customerPhone: phone, status: 'PENDING', errorMessage: undefined, retryAfter: undefined, attempts: 0 } },
    );
    await this.campaignModel.updateOne(
      { _id: new Types.ObjectId(campaignId) },
      { $inc: { failedCount: -1, pendingCount: 1 } },
    );
  }

  async remove(id: string): Promise<void> {
    const campaign = await this.campaignModel.findById(id).exec();
    if (!campaign) throw new NotFoundException(`Campaña ${id} no encontrada`);
    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden eliminar campañas en estado DRAFT');
    }
    await this.campaignModel.deleteOne({ _id: campaign._id });
    await this.recipientModel.deleteMany({ campaignId: campaign._id });
  }

  // ─── Logging ──────────────────────────────────────────────────────────────

  private writeLog(
    campaignId: Types.ObjectId,
    level: LogLevel,
    event: LogEvent,
    opts?: { waveNumber?: number; recipientPhone?: string; details?: string },
  ): void {
    // Fire-and-forget: no bloquea el flujo de envío
    this.logModel.create({
      campaignId,
      level,
      event,
      waveNumber: opts?.waveNumber,
      recipientPhone: opts?.recipientPhone,
      details: opts?.details,
    }).catch((err) => this.logger.error(`Failed to write campaign log: ${err}`));
  }

  async getLogs(campaignId: string): Promise<CampaignLog[]> {
    return this.logModel
      .find({ campaignId: new Types.ObjectId(campaignId) })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean() as unknown as CampaignLog[];
  }

  // ─── Waves (envío en partes) ───────────────────────────────────────────────

  async configureWaves(
    campaignId: string,
    waves: { scheduledAt: Date; recipientCount: number }[],
  ): Promise<Campaign> {
    const campaign = await this.campaignModel.findById(campaignId);
    if (!campaign) throw new NotFoundException(`Campaña ${campaignId} no encontrada`);
    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden configurar waves en campañas DRAFT');
    }
    await this.assertWavesMatchEligibleRecipients(waves, {
      siguiendo: campaign.recipientFilter?.siguiendo,
      estado: campaign.recipientFilter?.estado,
      producto: (campaign.recipientFilter as any)?.producto,
    });
    const waveDocs = this.buildWaveDocuments(waves);

    await this.campaignModel.updateOne(
      { _id: campaign._id },
      { $set: { waves: waveDocs } },
    );

    return this.findById(campaignId);
  }

  // ─── Reconfigurar oleadas programadas (RUNNING) ──────────────────────────

  async reconfigureScheduledWaves(
    campaignId: string,
    newWaves: { scheduledAt: Date; recipientCount: number }[],
  ): Promise<Campaign> {
    const campaign = await this.campaignModel.findById(campaignId);
    if (!campaign) throw new NotFoundException(`Campaña ${campaignId} no encontrada`);
    if (campaign.status !== 'RUNNING') {
      throw new BadRequestException('Solo se pueden reconfigurar oleadas de campañas en ejecución');
    }

    const existingWaves = campaign.waves ?? [];
    const scheduledWaves = existingWaves.filter((w) => w.status === 'SCHEDULED');
    if (scheduledWaves.length === 0) {
      throw new BadRequestException('No hay oleadas programadas para reconfigurar');
    }
    if (newWaves.length === 0) {
      throw new BadRequestException('Debe definir al menos una oleada');
    }

    // Validaciones básicas
    for (const w of newWaves) {
      if (!Number.isFinite(w.recipientCount) || w.recipientCount < 1) {
        throw new BadRequestException('Cada oleada debe tener al menos 1 destinatario');
      }
      if (Number.isNaN(w.scheduledAt.getTime())) {
        throw new BadRequestException('Fecha y hora de oleada inválida');
      }
    }

    // Contar pending en las waves SCHEDULED actuales
    const scheduledWaveNumbers = scheduledWaves.map((w) => w.waveNumber);
    const pendingCount = await this.recipientModel.countDocuments({
      campaignId: campaign._id,
      status: 'PENDING',
      waveNumber: { $in: scheduledWaveNumbers },
    });

    const sumNew = newWaves.reduce((s, w) => s + w.recipientCount, 0);
    if (sumNew !== pendingCount) {
      throw new BadRequestException(
        `La suma de destinatarios (${sumNew}) debe coincidir con los pendientes en oleadas programadas (${pendingCount})`,
      );
    }

    // Obtener recipients pendientes ordenados para redistribuir
    const pendingRecipients = await this.recipientModel
      .find({
        campaignId: campaign._id,
        status: 'PENDING',
        waveNumber: { $in: scheduledWaveNumbers },
      })
      .sort({ createdAt: 1 })
      .lean() as unknown as CampaignRecipient[];

    // Calcular el waveNumber base para nuevas waves (después del max existente)
    const maxExistingWave = Math.max(...existingWaves.map((w) => w.waveNumber));

    // Construir nuevas wave docs reutilizando números de las SCHEDULED actuales
    // y asignando nuevos números para oleadas adicionales
    const availableNumbers = [...scheduledWaveNumbers].sort((a, b) => a - b);
    const newWaveDocs = newWaves.map((w, i) => ({
      waveNumber: availableNumbers[i] ?? maxExistingWave + (i - availableNumbers.length + 1),
      scheduledAt: w.scheduledAt,
      recipientCount: w.recipientCount,
      status: 'SCHEDULED' as const,
      sentCount: 0,
      failedCount: 0,
    }));

    // Redistribuir waveNumber en recipients
    let offset = 0;
    for (const wavDoc of newWaveDocs) {
      const slice = pendingRecipients.slice(offset, offset + wavDoc.recipientCount);
      if (slice.length > 0) {
        const ids = slice.map((r) => r._id);
        await this.recipientModel.updateMany(
          { _id: { $in: ids } },
          { $set: { waveNumber: wavDoc.waveNumber } },
        );
      }
      offset += wavDoc.recipientCount;
    }

    // Reemplazar waves SCHEDULED en el documento de campaña
    const keptWaves = existingWaves.filter((w) => w.status !== 'SCHEDULED');
    await this.campaignModel.updateOne(
      { _id: campaign._id },
      { $set: { waves: [...keptWaves, ...newWaveDocs] } },
    );

    this.writeLog(campaign._id as Types.ObjectId, 'INFO', 'WAVE_RESCHEDULED', {
      details: `Oleadas programadas reconfiguradas: ${newWaveDocs.length} oleadas, ${pendingCount} destinatarios redistribuidos`,
    });

    return this.findById(campaignId);
  }

  // ─── Reprogramar oleada ───────────────────────────────────────────────────

  async rescheduleWave(campaignId: string, waveNumber: number, scheduledAt: Date): Promise<Campaign> {
    const campaign = await this.campaignModel.findById(campaignId);
    if (!campaign) throw new NotFoundException(`Campaña ${campaignId} no encontrada`);
    if (campaign.status !== 'RUNNING') {
      throw new BadRequestException('Solo se pueden reprogramar oleadas de campañas en ejecución');
    }
    const wave = (campaign.waves ?? []).find((w) => w.waveNumber === waveNumber);
    if (!wave) throw new NotFoundException(`Oleada ${waveNumber} no encontrada`);
    if (wave.status !== 'SCHEDULED') {
      throw new BadRequestException(`Solo se pueden reprogramar oleadas en estado SCHEDULED (actual: ${wave.status})`);
    }
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Fecha y hora de oleada inválida');
    }

    await this.campaignModel.updateOne(
      { _id: campaign._id, 'waves.waveNumber': waveNumber },
      { $set: { 'waves.$.scheduledAt': scheduledAt } },
    );

    this.writeLog(campaign._id as Types.ObjectId, 'INFO', 'WAVE_RESCHEDULED', {
      waveNumber,
      details: `Oleada ${waveNumber} reprogramada para ${scheduledAt.toISOString()}`,
    });

    return this.findById(campaignId);
  }

  // ─── Ejecución ────────────────────────────────────────────────────────────

  async execute(campaignId: string): Promise<Campaign> {
    const campaign = await this.campaignModel.findById(campaignId);
    if (!campaign) throw new NotFoundException(`Campaña ${campaignId} no encontrada`);
    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException(`Solo se pueden ejecutar campañas en estado DRAFT (actual: ${campaign.status})`);
    }

    // Construir query de clientes según filtros
    const query: Record<string, any> = {};
    if (campaign.recipientFilter?.siguiendo?.length) {
      query['siguiendo'] = { $in: campaign.recipientFilter.siguiendo };
    }
    if (campaign.recipientFilter?.estado?.length) {
      query['estado'] = { $in: campaign.recipientFilter.estado };
    }
    if ((campaign.recipientFilter as any)?.producto?.length) {
      query['producto'] = { $in: (campaign.recipientFilter as any).producto };
    }

    const customers = await this.customerModel.find(query).lean() as unknown as Customer[];

    // Clasificar clientes y crear recipients
    const recipientDocs: Partial<CampaignRecipient>[] = [];
    let skippedCount = 0;

    for (const customer of customers) {
      const phone = this.normalizePhone(customer.telefono);
      const siguiendo = customer.siguiendo ?? 'SIN_ASIGNAR';
      const phoneNumberId = this.resolvePhoneNumberId(siguiendo);

      if (!phone) {
        recipientDocs.push({
          campaignId: campaign._id as Types.ObjectId,
          customerId: customer._id as Types.ObjectId,
          customerName: [customer.nombre, customer.apellido].filter(Boolean).join(' ') || undefined,
          customerPhone: customer.telefono ?? '',
          siguiendo,
          phoneNumberId: '',
          status: 'SKIPPED',
          skipReason: 'Sin teléfono válido',
          attempts: 0,
        });
        skippedCount++;
        continue;
      }

      if (!phoneNumberId) {
        recipientDocs.push({
          campaignId: campaign._id as Types.ObjectId,
          customerId: customer._id as Types.ObjectId,
          customerName: [customer.nombre, customer.apellido].filter(Boolean).join(' ') || undefined,
          customerPhone: phone,
          siguiendo,
          phoneNumberId: '',
          status: 'SKIPPED',
          skipReason: siguiendo === 'SIN_ASIGNAR'
            ? 'Cliente sin asesor asignado'
            : `Sin número de YCloud configurado para asesor ${siguiendo}`,
          attempts: 0,
        });
        skippedCount++;
        continue;
      }

      recipientDocs.push({
        campaignId: campaign._id as Types.ObjectId,
        customerId: customer._id as Types.ObjectId,
        customerName: [customer.nombre, customer.apellido].filter(Boolean).join(' ') || undefined,
        customerPhone: phone,
        siguiendo,
        phoneNumberId,
        status: 'PENDING',
        attempts: 0,
      });
    }

    // Distribuir recipients en waves si están configuradas
    const waves = campaign.waves ?? [];
    if (waves.length > 0) {
      const pendingDocs = recipientDocs.filter((r) => r.status === 'PENDING');
      let offset = 0;
      for (const wave of waves) {
        const slice = pendingDocs.slice(offset, offset + wave.recipientCount);
        slice.forEach((r) => { r.waveNumber = wave.waveNumber; });
        offset += wave.recipientCount;
      }
      // Los que sobran (si total > suma waves) van a la última wave
      if (offset < pendingDocs.length) {
        const lastWave = waves[waves.length - 1];
        pendingDocs.slice(offset).forEach((r) => { r.waveNumber = lastWave.waveNumber; });
      }
    }

    await this.recipientModel.insertMany(recipientDocs);

    const pendingCount = recipientDocs.filter((r) => r.status === 'PENDING').length;

    await this.campaignModel.updateOne(
      { _id: campaign._id },
      {
        $set: {
          status: 'RUNNING',
          startedAt: new Date(),
          totalRecipients: customers.length,
          pendingCount,
          skippedCount,
          sentCount: 0,
          failedCount: 0,
        },
      },
    );

    const waveSummary = waves.length > 0
      ? ` | ${waves.length} waves: ${waves.map(w => `wave${w.waveNumber} ${w.recipientCount} recipients @ ${w.scheduledAt.toISOString()}`).join(', ')}`
      : '';
    this.logger.log(
      `Campaign ${campaignId} queued: ${customers.length} recipients, ${pendingCount} pending, ${skippedCount} skipped${waveSummary}`,
    );

    this.writeLog(campaign._id as Types.ObjectId, 'INFO', 'CAMPAIGN_STARTED', {
      details: `${pendingCount} para enviar, ${skippedCount} omitidos${waves.length > 0 ? `, ${waves.length} partes programadas` : ''}`,
    });

    return this.findById(campaignId);
  }

  // ─── Procesamiento por cron ───────────────────────────────────────────────

  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingRecipients(): Promise<void> {
    const runningCampaigns = await this.campaignModel
      .find({ status: 'RUNNING' })
      .lean() as unknown as Campaign[];

    for (const campaign of runningCampaigns) {
      await this.processCampaignBatch(campaign._id as Types.ObjectId);
    }
  }

  private async processCampaignBatch(campaignId: Types.ObjectId): Promise<void> {
    const now = new Date();

    // Cargar la campaña una sola vez para todo el batch
    const campaign = await this.campaignModel.findById(campaignId).lean() as unknown as Campaign | null;
    if (!campaign) return;

    const waves = campaign.waves ?? [];

    if (waves.length > 0) {
      // ── Modo waves: activar waves cuya hora llegó ──────────────────────────
      for (const wave of waves) {
        if (wave.status === 'SCHEDULED' && new Date(wave.scheduledAt) <= now) {
          await this.campaignModel.updateOne(
            { _id: campaignId, 'waves.waveNumber': wave.waveNumber },
            { $set: { 'waves.$.status': 'RUNNING', 'waves.$.startedAt': now } },
          );
          this.writeLog(campaignId, 'INFO', 'WAVE_STARTED', {
            waveNumber: wave.waveNumber,
            details: `Parte ${wave.waveNumber} iniciada — ${wave.recipientCount} destinatarios programados`,
          });
          this.logger.log(`Campaign ${campaignId}: wave ${wave.waveNumber} started`);
        }
      }

      // Re-cargar para tener el estado actualizado de waves
      const updatedCampaign = await this.campaignModel.findById(campaignId).lean() as unknown as Campaign;
      const runningWaveNumbers = (updatedCampaign.waves ?? [])
        .filter(w => w.status === 'RUNNING')
        .map(w => w.waveNumber);

      if (runningWaveNumbers.length === 0) {
        // Ninguna wave activa todavía — verificar si todas completaron
        await this.checkCampaignCompletion(campaignId);
        return;
      }

      const batch = await this.recipientModel
        .find({
          campaignId,
          status: 'PENDING',
          waveNumber: { $in: runningWaveNumbers },
          $or: [
            { retryAfter: { $exists: false } },
            { retryAfter: { $lte: now } },
          ],
        })
        .sort({ waveNumber: 1, createdAt: 1 })
        .limit(BATCH_SIZE)
        .lean() as unknown as CampaignRecipient[];

      if (batch.length === 0) {
        // Waves en RUNNING pero sin pending: marcarlas como completadas
        for (const waveNumber of runningWaveNumbers) {
          const hasStillPending = await this.recipientModel.exists({
            campaignId, waveNumber, status: 'PENDING',
          });
          if (!hasStillPending) {
            const waveData = (updatedCampaign.waves ?? []).find(w => w.waveNumber === waveNumber);
            await this.campaignModel.updateOne(
              { _id: campaignId, 'waves.waveNumber': waveNumber },
              { $set: { 'waves.$.status': 'COMPLETED', 'waves.$.completedAt': now } },
            );
            this.writeLog(campaignId, 'INFO', 'WAVE_COMPLETED', {
              waveNumber,
              details: `Parte ${waveNumber} completada — ${waveData?.sentCount ?? 0} enviados, ${waveData?.failedCount ?? 0} fallidos`,
            });
            this.logger.log(`Campaign ${campaignId}: wave ${waveNumber} completed`);
          }
        }
        await this.checkCampaignCompletion(campaignId);
        return;
      }

      for (const recipient of batch) {
        await this.sendToRecipient(recipient._id as Types.ObjectId, updatedCampaign);
      }

    } else {
      // ── Modo clásico: sin waves ────────────────────────────────────────────
      const batch = await this.recipientModel
        .find({
          campaignId,
          status: 'PENDING',
          $or: [
            { retryAfter: { $exists: false } },
            { retryAfter: { $lte: now } },
          ],
        })
        .sort({ createdAt: 1 })
        .limit(BATCH_SIZE)
        .lean() as unknown as CampaignRecipient[];

      if (batch.length === 0) {
        await this.checkCampaignCompletion(campaignId);
        return;
      }

      for (const recipient of batch) {
        await this.sendToRecipient(recipient._id as Types.ObjectId, campaign);
      }
    }

    await this.checkCampaignCompletion(campaignId);
  }

  private async sendToRecipient(
    recipientId: Types.ObjectId,
    campaign: Campaign,
  ): Promise<void> {
    const recipient = await this.recipientModel.findById(recipientId);
    if (!recipient || recipient.status !== 'PENDING') return;

    await this.recipientModel.updateOne(
      { _id: recipientId },
      { $inc: { attempts: 1 } },
    );

    const campaignId = campaign._id as Types.ObjectId;

    try {
      const result = await this.ycloud.sendTemplateMessage({
        to: recipient.customerPhone,
        phoneNumberId: recipient.phoneNumberId,
        templateName: campaign.templateName,
        templateLanguage: campaign.templateLanguage,
        headerImageUrl: campaign.templateHeaderImageUrl,
        externalId: recipient._id.toString(),
      });

      await this.recipientModel.updateOne(
        { _id: recipientId },
        {
          $set: {
            status: 'SENT',
            yCloudMessageId: result.id,
            sentAt: new Date(),
            errorMessage: undefined,
          },
        },
      );

      // Actualizar contadores de campaign y wave
      const waveInc: Record<string, any> = { sentCount: 1, pendingCount: -1 };
      if (recipient.waveNumber != null) {
        await this.campaignModel.updateOne(
          { _id: campaignId, 'waves.waveNumber': recipient.waveNumber },
          { $inc: { sentCount: 1, pendingCount: -1, 'waves.$.sentCount': 1 } },
        );
      } else {
        await this.campaignModel.updateOne({ _id: campaignId }, { $inc: waveInc });
      }

      this.writeLog(campaignId, 'INFO', 'MESSAGE_SENT', {
        waveNumber: recipient.waveNumber,
        recipientPhone: recipient.customerPhone,
        details: result.id,
      });
      this.logger.log(
        `Sent to ${recipient.customerPhone} (campaign ${campaignId.toString()}) — YCloud ID: ${result.id}`,
      );
    } catch (err: any) {
      const ycloudErr = err as YCloudError;
      const isTransient = ycloudErr?.isTransient === true;
      const attempts = (recipient.attempts ?? 0) + 1;

      if (isTransient && attempts < MAX_ATTEMPTS) {
        const delayMs = Math.pow(2, attempts) * 60 * 1000;
        await this.recipientModel.updateOne(
          { _id: recipientId },
          { $set: { retryAfter: new Date(Date.now() + delayMs), errorMessage: friendlyYCloudMessage(ycloudErr) } },
        );
        this.writeLog(campaignId, 'WARN', 'MESSAGE_RETRY', {
          waveNumber: recipient.waveNumber,
          recipientPhone: recipient.customerPhone,
          details: `Intento ${attempts}/${MAX_ATTEMPTS} — reintento en ${delayMs / 60000}min — ${ycloudErr.message}`,
        });
        this.logger.warn(
          `Transient error for ${recipient.customerPhone}, retry in ${delayMs / 1000}s — ${ycloudErr.message}`,
        );
      } else {
        await this.recipientModel.updateOne(
          { _id: recipientId },
          { $set: { status: 'FAILED', errorMessage: ycloudErr ? friendlyYCloudMessage(ycloudErr) : String(err), retryAfter: undefined } },
        );

        if (recipient.waveNumber != null) {
          await this.campaignModel.updateOne(
            { _id: campaignId, 'waves.waveNumber': recipient.waveNumber },
            { $inc: { failedCount: 1, pendingCount: -1, 'waves.$.failedCount': 1 } },
          );
        } else {
          await this.campaignModel.updateOne({ _id: campaignId }, { $inc: { failedCount: 1, pendingCount: -1 } });
        }

        this.writeLog(campaignId, 'ERROR', 'MESSAGE_FAILED', {
          waveNumber: recipient.waveNumber,
          recipientPhone: recipient.customerPhone,
          details: ycloudErr?.message ?? String(err),
        });
        this.logger.error(
          `Permanent failure for ${recipient.customerPhone} (campaign ${campaignId.toString()}): ${ycloudErr?.message ?? err}`,
        );
      }
    }
  }

  private async checkCampaignCompletion(campaignId: Types.ObjectId): Promise<void> {
    const remaining = await this.recipientModel.countDocuments({
      campaignId,
      status: 'PENDING',
    });

    if (remaining === 0) {
      const campaign = await this.campaignModel.findOne({
        _id: campaignId,
        status: 'RUNNING',
      });

      if (campaign) {
        // Cerrar cualquier wave que quedó en RUNNING (puede ocurrir cuando el último
        // batch se procesa sin pasar por el chequeo batch.length === 0)
        const now = new Date();
        for (const wave of (campaign.waves ?? [])) {
          if (wave.status === 'RUNNING') {
            await this.campaignModel.updateOne(
              { _id: campaignId, 'waves.waveNumber': wave.waveNumber },
              { $set: { 'waves.$.status': 'COMPLETED', 'waves.$.completedAt': now } },
            );
            this.writeLog(campaignId, 'INFO', 'WAVE_COMPLETED', {
              waveNumber: wave.waveNumber,
              details: `Parte ${wave.waveNumber} completada — ${wave.sentCount ?? 0} enviados, ${wave.failedCount ?? 0} fallidos`,
            });
            this.logger.log(`Campaign ${campaignId}: wave ${wave.waveNumber} completed (via campaign completion check)`);
          }
        }

        await this.campaignModel.updateOne(
          { _id: campaignId },
          { $set: { status: 'COMPLETED', completedAt: now, pendingCount: 0 } },
        );
        this.writeLog(campaignId, 'INFO', 'CAMPAIGN_COMPLETED', {
          details: 'Todos los mensajes procesados',
        });
        this.logger.log(`Campaign ${campaignId.toString()} completed`);
      }
    }
  }

  // ─── Webhook de YCloud ────────────────────────────────────────────────────

  async handleWebhook(payload: Record<string, any>): Promise<void> {
    const msg = payload['whatsappMessage'];
    if (!msg) return;

    const externalId: string | undefined = msg['externalId'];
    const status: string | undefined = msg['status'];

    if (!externalId || !status) return;

    // externalId = recipientId que enviamos al crear el mensaje
    let recipientId: Types.ObjectId;
    try {
      recipientId = new Types.ObjectId(externalId);
    } catch {
      return;
    }

    // Solo actualizamos estado terminal desde el webhook si aún está en SENT
    // (evitamos pisar un estado ya definitivo)
    if (status === 'FAILED' || status === 'UNDELIVERED') {
      const errorMsg = msg['whatsappApiError']?.message ?? `Delivery failed: ${status}`;
      await this.recipientModel.updateOne(
        { _id: recipientId, status: 'SENT' },
        { $set: { status: 'FAILED', errorMessage: errorMsg } },
      );
    }

    this.logger.debug(`Webhook: recipient ${externalId} → ${status}`);
  }
}
