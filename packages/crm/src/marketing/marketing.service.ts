import { Injectable, Logger, NotFoundException, BadRequestException, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import { Campaign, CampaignStatus } from './schemas/campaign.schema';
import { CampaignRecipient } from './schemas/campaign-recipient.schema';
import { DirectMessage } from './schemas/direct-message.schema';
import { Customer } from '../customers/schemas/customer.schema';
import { YCloudClient, YCloudError } from './ycloud.client';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { SendSingleDto } from './dto/send-single.dto';

const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 3;

@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name);

  constructor(
    @InjectModel('Campaign')
    private readonly campaignModel: Model<Campaign>,
    @InjectModel('CampaignRecipient')
    private readonly recipientModel: Model<CampaignRecipient>,
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
    return this.ycloud.listApprovedTemplates();
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
    const campaign = await this.campaignModel.create({
      name: dto.name,
      templateName: dto.templateName,
      templateLanguage: dto.templateLanguage,
      recipientFilter: dto.recipientFilter ?? {},
      status: 'DRAFT',
      createdBy: userId,
      totalRecipients: 0,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      pendingCount: 0,
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

  async remove(id: string): Promise<void> {
    const campaign = await this.campaignModel.findById(id).exec();
    if (!campaign) throw new NotFoundException(`Campaña ${id} no encontrada`);
    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden eliminar campañas en estado DRAFT');
    }
    await this.campaignModel.deleteOne({ _id: campaign._id });
    await this.recipientModel.deleteMany({ campaignId: campaign._id });
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

    this.logger.log(
      `Campaign ${campaignId} queued: ${customers.length} recipients, ${pendingCount} pending, ${skippedCount} skipped`,
    );

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
      await this.sendToRecipient(recipient._id as Types.ObjectId, campaignId);
    }

    await this.checkCampaignCompletion(campaignId);
  }

  private async sendToRecipient(
    recipientId: Types.ObjectId,
    campaignId: Types.ObjectId,
  ): Promise<void> {
    const recipient = await this.recipientModel.findById(recipientId);
    if (!recipient || recipient.status !== 'PENDING') return;

    await this.recipientModel.updateOne(
      { _id: recipientId },
      { $inc: { attempts: 1 } },
    );

    const campaign = await this.campaignModel.findById(campaignId).lean() as unknown as Campaign | null;
    if (!campaign) return;

    try {
      const result = await this.ycloud.sendTemplateMessage({
        to: recipient.customerPhone,
        phoneNumberId: recipient.phoneNumberId,
        templateName: campaign.templateName,
        templateLanguage: campaign.templateLanguage,
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

      await this.campaignModel.updateOne(
        { _id: campaignId },
        { $inc: { sentCount: 1, pendingCount: -1 } },
      );

      this.logger.log(
        `Sent to ${recipient.customerPhone} (campaign ${campaignId.toString()}) — YCloud ID: ${result.id}`,
      );
    } catch (err: any) {
      const ycloudErr = err as YCloudError;
      const isTransient = ycloudErr?.isTransient === true;
      const attempts = (recipient.attempts ?? 0) + 1;

      if (isTransient && attempts < MAX_ATTEMPTS) {
        // Exponential backoff: 2^attempts minutos
        const delayMs = Math.pow(2, attempts) * 60 * 1000;
        await this.recipientModel.updateOne(
          { _id: recipientId },
          {
            $set: {
              retryAfter: new Date(Date.now() + delayMs),
              errorMessage: ycloudErr.message,
            },
          },
        );
        this.logger.warn(
          `Transient error for ${recipient.customerPhone}, retry in ${delayMs / 1000}s — ${ycloudErr.message}`,
        );
      } else {
        await this.recipientModel.updateOne(
          { _id: recipientId },
          {
            $set: {
              status: 'FAILED',
              errorMessage: ycloudErr?.message ?? String(err),
              retryAfter: undefined,
            },
          },
        );

        await this.campaignModel.updateOne(
          { _id: campaignId },
          { $inc: { failedCount: 1, pendingCount: -1 } },
        );

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
      const hasRunning = await this.campaignModel.findOne({
        _id: campaignId,
        status: 'RUNNING',
      });

      if (hasRunning) {
        await this.campaignModel.updateOne(
          { _id: campaignId },
          { $set: { status: 'COMPLETED', completedAt: new Date(), pendingCount: 0 } },
        );
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
