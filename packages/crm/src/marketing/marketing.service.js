"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MarketingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const mongoose_2 = require("mongoose");
const ycloud_client_1 = require("./ycloud.client");
const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 3;
const YCLOUD_ERROR_MESSAGES = {
    PARAM_INVALID: 'Caracteres inválidos',
    BALANCE_INSUFFICIENT: 'Fondos insuficientes',
};
function friendlyYCloudMessage(err) {
    return YCLOUD_ERROR_MESSAGES[err.code] ?? err.message;
}
let MarketingService = MarketingService_1 = class MarketingService {
    constructor(campaignModel, recipientModel, logModel, directMessageModel, customerModel, ycloud, config) {
        this.campaignModel = campaignModel;
        this.recipientModel = recipientModel;
        this.logModel = logModel;
        this.directMessageModel = directMessageModel;
        this.customerModel = customerModel;
        this.ycloud = ycloud;
        this.config = config;
        this.logger = new common_1.Logger(MarketingService_1.name);
    }
    // ─── Advisor → YCloud phoneNumberId ──────────────────────────────────────
    resolvePhoneNumberId(siguiendo) {
        const key = siguiendo?.toUpperCase();
        const map = {
            EZEQUIEL: this.config.get('YCLOUD_PHONE_ID_EZEQUIEL', ''),
            DENIS: this.config.get('YCLOUD_PHONE_ID_DENIS', ''),
            MARTIN: this.config.get('YCLOUD_PHONE_ID_MARTIN', ''),
        };
        const id = map[key];
        return id && id.trim().length > 0 ? id.trim() : null;
    }
    // ─── Normalización de teléfono a E.164 ───────────────────────────────────
    normalizePhone(phone) {
        if (!phone)
            return null;
        let clean = phone.replace(/[\s\-\(\)]/g, '');
        if (clean.startsWith('+549') && clean.length >= 13)
            return clean;
        if (clean.startsWith('549') && clean.length >= 12)
            return `+${clean}`;
        if (clean.startsWith('54') && clean.length >= 11)
            return `+${clean}`;
        if (clean.length >= 10 && !clean.startsWith('54'))
            return `+549${clean}`;
        return null;
    }
    // ─── Listado de templates ─────────────────────────────────────────────────
    async getTemplates() {
        const templates = await this.ycloud.listApprovedTemplates();
        // Reverse map: wabaId → advisor name
        const wabaToAdvisor = {};
        const advisors = [
            { key: 'YCLOUD_WABA_ID_EZEQUIEL', label: 'Ezequiel' },
            { key: 'YCLOUD_WABA_ID_DENIS', label: 'Denis' },
            { key: 'YCLOUD_WABA_ID_MARTIN', label: 'Martin' },
        ];
        for (const { key, label } of advisors) {
            const id = this.config.get(key, '').trim();
            if (id)
                wabaToAdvisor[id] = label;
        }
        return templates.map((t) => ({
            ...t,
            channelLabel: wabaToAdvisor[t.wabaId] ?? null,
        }));
    }
    async getFilterOptions() {
        const raw = await this.customerModel.distinct('producto');
        const productos = raw
            .filter((v) => typeof v === 'string' && v.trim().length > 0)
            .sort((a, b) => a.localeCompare(b, 'es'));
        return { productos };
    }
    // ─── Preview de destinatarios (sin persistir) ─────────────────────────────
    async buildPreviewItems(filter) {
        const query = {};
        if (filter.siguiendo?.length)
            query['siguiendo'] = { $in: filter.siguiendo };
        if (filter.estado?.length)
            query['estado'] = { $in: filter.estado };
        if (filter.producto?.length)
            query['producto'] = { $in: filter.producto };
        const customers = await this.customerModel
            .find(query)
            .select('nombre apellido telefono siguiendo estado producto')
            .lean();
        return customers.map((customer) => {
            const phone = this.normalizePhone(customer.telefono);
            const siguiendo = customer.siguiendo ?? 'SIN_ASIGNAR';
            const phoneNumberId = this.resolvePhoneNumberId(siguiendo);
            const willSend = !!phone && !!phoneNumberId;
            let skipReason;
            if (!phone)
                skipReason = 'Sin teléfono válido';
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
                producto: customer.producto ?? '',
                willSend,
                skipReason,
            };
        });
    }
    async previewByFilter(filter) {
        return this.buildPreviewItems(filter);
    }
    async previewCampaign(campaignId) {
        const campaign = await this.campaignModel.findById(campaignId);
        if (!campaign)
            throw new common_1.NotFoundException(`Campaña ${campaignId} no encontrada`);
        return this.buildPreviewItems({
            siguiendo: campaign.recipientFilter?.siguiendo,
            estado: campaign.recipientFilter?.estado,
            producto: campaign.recipientFilter?.producto,
        });
    }
    async countEligibleWillSend(filter) {
        const preview = await this.buildPreviewItems(filter);
        return preview.filter((p) => p.willSend).length;
    }
    buildWaveDocuments(waves) {
        return waves.map((w, i) => ({
            waveNumber: i + 1,
            scheduledAt: w.scheduledAt,
            recipientCount: w.recipientCount,
            status: 'SCHEDULED',
            sentCount: 0,
            failedCount: 0,
        }));
    }
    async assertWavesMatchEligibleRecipients(waves, filter) {
        if (!waves.length) {
            throw new common_1.BadRequestException('Debe definir al menos una oleada');
        }
        if (waves.length > 3) {
            throw new common_1.BadRequestException('Máximo 3 oleadas');
        }
        for (const w of waves) {
            if (!Number.isFinite(w.recipientCount) || w.recipientCount < 1) {
                throw new common_1.BadRequestException('Cada oleada debe tener al menos 1 destinatario');
            }
            if (Number.isNaN(w.scheduledAt.getTime())) {
                throw new common_1.BadRequestException('Fecha y hora de oleada inválida');
            }
        }
        const eligible = await this.countEligibleWillSend(filter);
        const sum = waves.reduce((s, w) => s + w.recipientCount, 0);
        if (eligible === 0) {
            throw new common_1.BadRequestException('No hay destinatarios elegibles para enviar con los filtros actuales');
        }
        if (sum !== eligible) {
            throw new common_1.BadRequestException(`La suma de destinatarios por oleada (${sum}) debe coincidir con los elegibles para envío (${eligible})`);
        }
    }
    // ─── Envío puntual ────────────────────────────────────────────────────────
    async sendSingle(dto, userId) {
        const phone = this.normalizePhone(dto.phone);
        if (!phone) {
            throw new common_1.BadRequestException(`Número de teléfono inválido: "${dto.phone}"`);
        }
        const phoneNumberId = this.resolvePhoneNumberId(dto.advisor);
        if (!phoneNumberId) {
            throw new common_1.BadRequestException(`No hay número de YCloud configurado para el asesor ${dto.advisor}`);
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
            this.logger.log(`Envío puntual → ${phone} (${dto.advisor}) plantilla "${dto.templateName}" — YCloud ID: ${result.id}`);
            return { messageId: result.id, to: phone };
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException || err instanceof common_1.HttpException)
                throw err;
            const status = (err?.status >= 400) ? err.status : 500;
            const message = err?.message ?? 'Error al enviar el mensaje por YCloud';
            throw new common_1.HttpException(message, status);
        }
    }
    async getDirectMessages() {
        return this.directMessageModel.find().sort({ createdAt: -1 }).limit(200).exec();
    }
    // ─── CRUD campañas ────────────────────────────────────────────────────────
    async create(dto, userId) {
        const recipientFilter = dto.recipientFilter ?? {};
        const filterForPreview = {
            siguiendo: recipientFilter.siguiendo,
            estado: recipientFilter.estado,
            producto: recipientFilter.producto,
        };
        let wavesDoc;
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
    async findAll() {
        return this.campaignModel.find().sort({ createdAt: -1 }).exec();
    }
    async findById(id) {
        const campaign = await this.campaignModel.findById(id).exec();
        if (!campaign)
            throw new common_1.NotFoundException(`Campaña ${id} no encontrada`);
        return campaign;
    }
    async getRecipients(campaignId) {
        return this.recipientModel
            .find({ campaignId: new mongoose_2.Types.ObjectId(campaignId) })
            .sort({ createdAt: 1 })
            .exec();
    }
    async retryRecipient(campaignId, recipientId) {
        const recipient = await this.recipientModel.findOne({
            _id: new mongoose_2.Types.ObjectId(recipientId),
            campaignId: new mongoose_2.Types.ObjectId(campaignId),
        });
        if (!recipient)
            throw new common_1.NotFoundException('Destinatario no encontrado');
        if (recipient.status !== 'FAILED') {
            throw new common_1.BadRequestException('Solo se pueden reintentar destinatarios en estado FAILED');
        }
        await this.recipientModel.updateOne({ _id: recipient._id }, { $set: { status: 'PENDING', errorMessage: undefined, retryAfter: undefined, attempts: 0 } });
        await this.campaignModel.updateOne({ _id: new mongoose_2.Types.ObjectId(campaignId) }, { $inc: { failedCount: -1, pendingCount: 1 } });
    }
    async updateRecipientPhone(campaignId, recipientId, phone) {
        const recipient = await this.recipientModel.findOne({
            _id: new mongoose_2.Types.ObjectId(recipientId),
            campaignId: new mongoose_2.Types.ObjectId(campaignId),
        });
        if (!recipient)
            throw new common_1.NotFoundException('Destinatario no encontrado');
        if (recipient.status !== 'FAILED') {
            throw new common_1.BadRequestException('Solo se puede editar el teléfono de destinatarios en estado FAILED');
        }
        // Validación básica de formato E.164
        if (!/^\+\d{7,15}$/.test(phone)) {
            throw new common_1.BadRequestException('El número debe estar en formato E.164 (ej: +5491122334455)');
        }
        await this.recipientModel.updateOne({ _id: recipient._id }, { $set: { customerPhone: phone, status: 'PENDING', errorMessage: undefined, retryAfter: undefined, attempts: 0 } });
        await this.campaignModel.updateOne({ _id: new mongoose_2.Types.ObjectId(campaignId) }, { $inc: { failedCount: -1, pendingCount: 1 } });
    }
    async remove(id) {
        const campaign = await this.campaignModel.findById(id).exec();
        if (!campaign)
            throw new common_1.NotFoundException(`Campaña ${id} no encontrada`);
        if (campaign.status !== 'DRAFT') {
            throw new common_1.BadRequestException('Solo se pueden eliminar campañas en estado DRAFT');
        }
        await this.campaignModel.deleteOne({ _id: campaign._id });
        await this.recipientModel.deleteMany({ campaignId: campaign._id });
    }
    // ─── Logging ──────────────────────────────────────────────────────────────
    writeLog(campaignId, level, event, opts) {
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
    async getLogs(campaignId) {
        return this.logModel
            .find({ campaignId: new mongoose_2.Types.ObjectId(campaignId) })
            .sort({ createdAt: -1 })
            .limit(500)
            .lean();
    }
    // ─── Waves (envío en partes) ───────────────────────────────────────────────
    async configureWaves(campaignId, waves) {
        const campaign = await this.campaignModel.findById(campaignId);
        if (!campaign)
            throw new common_1.NotFoundException(`Campaña ${campaignId} no encontrada`);
        if (campaign.status !== 'DRAFT') {
            throw new common_1.BadRequestException('Solo se pueden configurar waves en campañas DRAFT');
        }
        await this.assertWavesMatchEligibleRecipients(waves, {
            siguiendo: campaign.recipientFilter?.siguiendo,
            estado: campaign.recipientFilter?.estado,
            producto: campaign.recipientFilter?.producto,
        });
        const waveDocs = this.buildWaveDocuments(waves);
        await this.campaignModel.updateOne({ _id: campaign._id }, { $set: { waves: waveDocs } });
        return this.findById(campaignId);
    }
    // ─── Reconfigurar oleadas programadas (RUNNING) ──────────────────────────
    async reconfigureScheduledWaves(campaignId, newWaves) {
        const campaign = await this.campaignModel.findById(campaignId);
        if (!campaign)
            throw new common_1.NotFoundException(`Campaña ${campaignId} no encontrada`);
        if (campaign.status !== 'RUNNING') {
            throw new common_1.BadRequestException('Solo se pueden reconfigurar oleadas de campañas en ejecución');
        }
        const existingWaves = campaign.waves ?? [];
        const scheduledWaves = existingWaves.filter((w) => w.status === 'SCHEDULED');
        if (scheduledWaves.length === 0) {
            throw new common_1.BadRequestException('No hay oleadas programadas para reconfigurar');
        }
        if (newWaves.length === 0) {
            throw new common_1.BadRequestException('Debe definir al menos una oleada');
        }
        // Validaciones básicas
        for (const w of newWaves) {
            if (!Number.isFinite(w.recipientCount) || w.recipientCount < 1) {
                throw new common_1.BadRequestException('Cada oleada debe tener al menos 1 destinatario');
            }
            if (Number.isNaN(w.scheduledAt.getTime())) {
                throw new common_1.BadRequestException('Fecha y hora de oleada inválida');
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
            throw new common_1.BadRequestException(`La suma de destinatarios (${sumNew}) debe coincidir con los pendientes en oleadas programadas (${pendingCount})`);
        }
        // Obtener recipients pendientes ordenados para redistribuir
        const pendingRecipients = await this.recipientModel
            .find({
            campaignId: campaign._id,
            status: 'PENDING',
            waveNumber: { $in: scheduledWaveNumbers },
        })
            .sort({ createdAt: 1 })
            .lean();
        // Calcular el waveNumber base para nuevas waves (después del max existente)
        const maxExistingWave = Math.max(...existingWaves.map((w) => w.waveNumber));
        // Construir nuevas wave docs reutilizando números de las SCHEDULED actuales
        // y asignando nuevos números para oleadas adicionales
        const availableNumbers = [...scheduledWaveNumbers].sort((a, b) => a - b);
        const newWaveDocs = newWaves.map((w, i) => ({
            waveNumber: availableNumbers[i] ?? maxExistingWave + (i - availableNumbers.length + 1),
            scheduledAt: w.scheduledAt,
            recipientCount: w.recipientCount,
            status: 'SCHEDULED',
            sentCount: 0,
            failedCount: 0,
        }));
        // Redistribuir waveNumber en recipients
        let offset = 0;
        for (const wavDoc of newWaveDocs) {
            const slice = pendingRecipients.slice(offset, offset + wavDoc.recipientCount);
            if (slice.length > 0) {
                const ids = slice.map((r) => r._id);
                await this.recipientModel.updateMany({ _id: { $in: ids } }, { $set: { waveNumber: wavDoc.waveNumber } });
            }
            offset += wavDoc.recipientCount;
        }
        // Reemplazar waves SCHEDULED en el documento de campaña
        const keptWaves = existingWaves.filter((w) => w.status !== 'SCHEDULED');
        await this.campaignModel.updateOne({ _id: campaign._id }, { $set: { waves: [...keptWaves, ...newWaveDocs] } });
        this.writeLog(campaign._id, 'INFO', 'WAVE_RESCHEDULED', {
            details: `Oleadas programadas reconfiguradas: ${newWaveDocs.length} oleadas, ${pendingCount} destinatarios redistribuidos`,
        });
        return this.findById(campaignId);
    }
    // ─── Reprogramar oleada ───────────────────────────────────────────────────
    async rescheduleWave(campaignId, waveNumber, scheduledAt) {
        const campaign = await this.campaignModel.findById(campaignId);
        if (!campaign)
            throw new common_1.NotFoundException(`Campaña ${campaignId} no encontrada`);
        if (campaign.status !== 'RUNNING') {
            throw new common_1.BadRequestException('Solo se pueden reprogramar oleadas de campañas en ejecución');
        }
        const wave = (campaign.waves ?? []).find((w) => w.waveNumber === waveNumber);
        if (!wave)
            throw new common_1.NotFoundException(`Oleada ${waveNumber} no encontrada`);
        if (wave.status !== 'SCHEDULED') {
            throw new common_1.BadRequestException(`Solo se pueden reprogramar oleadas en estado SCHEDULED (actual: ${wave.status})`);
        }
        if (Number.isNaN(scheduledAt.getTime())) {
            throw new common_1.BadRequestException('Fecha y hora de oleada inválida');
        }
        await this.campaignModel.updateOne({ _id: campaign._id, 'waves.waveNumber': waveNumber }, { $set: { 'waves.$.scheduledAt': scheduledAt } });
        this.writeLog(campaign._id, 'INFO', 'WAVE_RESCHEDULED', {
            waveNumber,
            details: `Oleada ${waveNumber} reprogramada para ${scheduledAt.toISOString()}`,
        });
        return this.findById(campaignId);
    }
    // ─── Ejecución ────────────────────────────────────────────────────────────
    async execute(campaignId) {
        const campaign = await this.campaignModel.findById(campaignId);
        if (!campaign)
            throw new common_1.NotFoundException(`Campaña ${campaignId} no encontrada`);
        if (campaign.status !== 'DRAFT') {
            throw new common_1.BadRequestException(`Solo se pueden ejecutar campañas en estado DRAFT (actual: ${campaign.status})`);
        }
        // Construir query de clientes según filtros
        const query = {};
        if (campaign.recipientFilter?.siguiendo?.length) {
            query['siguiendo'] = { $in: campaign.recipientFilter.siguiendo };
        }
        if (campaign.recipientFilter?.estado?.length) {
            query['estado'] = { $in: campaign.recipientFilter.estado };
        }
        if (campaign.recipientFilter?.producto?.length) {
            query['producto'] = { $in: campaign.recipientFilter.producto };
        }
        const customers = await this.customerModel.find(query).lean();
        // Clasificar clientes y crear recipients
        const recipientDocs = [];
        let skippedCount = 0;
        for (const customer of customers) {
            const phone = this.normalizePhone(customer.telefono);
            const siguiendo = customer.siguiendo ?? 'SIN_ASIGNAR';
            const phoneNumberId = this.resolvePhoneNumberId(siguiendo);
            if (!phone) {
                recipientDocs.push({
                    campaignId: campaign._id,
                    customerId: customer._id,
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
                    campaignId: campaign._id,
                    customerId: customer._id,
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
                campaignId: campaign._id,
                customerId: customer._id,
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
        await this.campaignModel.updateOne({ _id: campaign._id }, {
            $set: {
                status: 'RUNNING',
                startedAt: new Date(),
                totalRecipients: customers.length,
                pendingCount,
                skippedCount,
                sentCount: 0,
                failedCount: 0,
            },
        });
        const waveSummary = waves.length > 0
            ? ` | ${waves.length} waves: ${waves.map(w => `wave${w.waveNumber} ${w.recipientCount} recipients @ ${w.scheduledAt.toISOString()}`).join(', ')}`
            : '';
        this.logger.log(`Campaign ${campaignId} queued: ${customers.length} recipients, ${pendingCount} pending, ${skippedCount} skipped${waveSummary}`);
        this.writeLog(campaign._id, 'INFO', 'CAMPAIGN_STARTED', {
            details: `${pendingCount} para enviar, ${skippedCount} omitidos${waves.length > 0 ? `, ${waves.length} partes programadas` : ''}`,
        });
        return this.findById(campaignId);
    }
    // ─── Procesamiento por cron ───────────────────────────────────────────────
    async processPendingRecipients() {
        const runningCampaigns = await this.campaignModel
            .find({ status: 'RUNNING' })
            .lean();
        for (const campaign of runningCampaigns) {
            await this.processCampaignBatch(campaign._id);
        }
    }
    async processCampaignBatch(campaignId) {
        const now = new Date();
        // Cargar la campaña una sola vez para todo el batch
        const campaign = await this.campaignModel.findById(campaignId).lean();
        if (!campaign)
            return;
        const waves = campaign.waves ?? [];
        if (waves.length > 0) {
            // ── Modo waves: activar waves cuya hora llegó ──────────────────────────
            for (const wave of waves) {
                if (wave.status === 'SCHEDULED' && new Date(wave.scheduledAt) <= now) {
                    await this.campaignModel.updateOne({ _id: campaignId, 'waves.waveNumber': wave.waveNumber }, { $set: { 'waves.$.status': 'RUNNING', 'waves.$.startedAt': now } });
                    this.writeLog(campaignId, 'INFO', 'WAVE_STARTED', {
                        waveNumber: wave.waveNumber,
                        details: `Parte ${wave.waveNumber} iniciada — ${wave.recipientCount} destinatarios programados`,
                    });
                    this.logger.log(`Campaign ${campaignId}: wave ${wave.waveNumber} started`);
                }
            }
            // Re-cargar para tener el estado actualizado de waves
            const updatedCampaign = await this.campaignModel.findById(campaignId).lean();
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
                .lean();
            if (batch.length === 0) {
                // Waves en RUNNING pero sin pending: marcarlas como completadas
                for (const waveNumber of runningWaveNumbers) {
                    const hasStillPending = await this.recipientModel.exists({
                        campaignId, waveNumber, status: 'PENDING',
                    });
                    if (!hasStillPending) {
                        const waveData = (updatedCampaign.waves ?? []).find(w => w.waveNumber === waveNumber);
                        await this.campaignModel.updateOne({ _id: campaignId, 'waves.waveNumber': waveNumber }, { $set: { 'waves.$.status': 'COMPLETED', 'waves.$.completedAt': now } });
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
                await this.sendToRecipient(recipient._id, updatedCampaign);
            }
        }
        else {
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
                .lean();
            if (batch.length === 0) {
                await this.checkCampaignCompletion(campaignId);
                return;
            }
            for (const recipient of batch) {
                await this.sendToRecipient(recipient._id, campaign);
            }
        }
        await this.checkCampaignCompletion(campaignId);
    }
    async sendToRecipient(recipientId, campaign) {
        const recipient = await this.recipientModel.findById(recipientId);
        if (!recipient || recipient.status !== 'PENDING')
            return;
        await this.recipientModel.updateOne({ _id: recipientId }, { $inc: { attempts: 1 } });
        const campaignId = campaign._id;
        try {
            const result = await this.ycloud.sendTemplateMessage({
                to: recipient.customerPhone,
                phoneNumberId: recipient.phoneNumberId,
                templateName: campaign.templateName,
                templateLanguage: campaign.templateLanguage,
                headerImageUrl: campaign.templateHeaderImageUrl,
                externalId: recipient._id.toString(),
            });
            await this.recipientModel.updateOne({ _id: recipientId }, {
                $set: {
                    status: 'SENT',
                    yCloudMessageId: result.id,
                    sentAt: new Date(),
                    errorMessage: undefined,
                },
            });
            // Actualizar contadores de campaign y wave
            const waveInc = { sentCount: 1, pendingCount: -1 };
            if (recipient.waveNumber != null) {
                await this.campaignModel.updateOne({ _id: campaignId, 'waves.waveNumber': recipient.waveNumber }, { $inc: { sentCount: 1, pendingCount: -1, 'waves.$.sentCount': 1 } });
            }
            else {
                await this.campaignModel.updateOne({ _id: campaignId }, { $inc: waveInc });
            }
            this.writeLog(campaignId, 'INFO', 'MESSAGE_SENT', {
                waveNumber: recipient.waveNumber,
                recipientPhone: recipient.customerPhone,
                details: result.id,
            });
            this.logger.log(`Sent to ${recipient.customerPhone} (campaign ${campaignId.toString()}) — YCloud ID: ${result.id}`);
        }
        catch (err) {
            const ycloudErr = err;
            const isTransient = ycloudErr?.isTransient === true;
            const attempts = (recipient.attempts ?? 0) + 1;
            if (isTransient && attempts < MAX_ATTEMPTS) {
                const delayMs = Math.pow(2, attempts) * 60 * 1000;
                await this.recipientModel.updateOne({ _id: recipientId }, { $set: { retryAfter: new Date(Date.now() + delayMs), errorMessage: friendlyYCloudMessage(ycloudErr) } });
                this.writeLog(campaignId, 'WARN', 'MESSAGE_RETRY', {
                    waveNumber: recipient.waveNumber,
                    recipientPhone: recipient.customerPhone,
                    details: `Intento ${attempts}/${MAX_ATTEMPTS} — reintento en ${delayMs / 60000}min — ${ycloudErr.message}`,
                });
                this.logger.warn(`Transient error for ${recipient.customerPhone}, retry in ${delayMs / 1000}s — ${ycloudErr.message}`);
            }
            else {
                await this.recipientModel.updateOne({ _id: recipientId }, { $set: { status: 'FAILED', errorMessage: ycloudErr ? friendlyYCloudMessage(ycloudErr) : String(err), retryAfter: undefined } });
                if (recipient.waveNumber != null) {
                    await this.campaignModel.updateOne({ _id: campaignId, 'waves.waveNumber': recipient.waveNumber }, { $inc: { failedCount: 1, pendingCount: -1, 'waves.$.failedCount': 1 } });
                }
                else {
                    await this.campaignModel.updateOne({ _id: campaignId }, { $inc: { failedCount: 1, pendingCount: -1 } });
                }
                this.writeLog(campaignId, 'ERROR', 'MESSAGE_FAILED', {
                    waveNumber: recipient.waveNumber,
                    recipientPhone: recipient.customerPhone,
                    details: ycloudErr?.message ?? String(err),
                });
                this.logger.error(`Permanent failure for ${recipient.customerPhone} (campaign ${campaignId.toString()}): ${ycloudErr?.message ?? err}`);
            }
        }
    }
    async checkCampaignCompletion(campaignId) {
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
                        await this.campaignModel.updateOne({ _id: campaignId, 'waves.waveNumber': wave.waveNumber }, { $set: { 'waves.$.status': 'COMPLETED', 'waves.$.completedAt': now } });
                        this.writeLog(campaignId, 'INFO', 'WAVE_COMPLETED', {
                            waveNumber: wave.waveNumber,
                            details: `Parte ${wave.waveNumber} completada — ${wave.sentCount ?? 0} enviados, ${wave.failedCount ?? 0} fallidos`,
                        });
                        this.logger.log(`Campaign ${campaignId}: wave ${wave.waveNumber} completed (via campaign completion check)`);
                    }
                }
                await this.campaignModel.updateOne({ _id: campaignId }, { $set: { status: 'COMPLETED', completedAt: now, pendingCount: 0 } });
                this.writeLog(campaignId, 'INFO', 'CAMPAIGN_COMPLETED', {
                    details: 'Todos los mensajes procesados',
                });
                this.logger.log(`Campaign ${campaignId.toString()} completed`);
            }
        }
    }
    // ─── Webhook de YCloud ────────────────────────────────────────────────────
    async handleWebhook(payload) {
        const msg = payload['whatsappMessage'];
        if (!msg)
            return;
        const externalId = msg['externalId'];
        const status = msg['status'];
        if (!externalId || !status)
            return;
        // externalId = recipientId que enviamos al crear el mensaje
        let recipientId;
        try {
            recipientId = new mongoose_2.Types.ObjectId(externalId);
        }
        catch {
            return;
        }
        // Solo actualizamos estado terminal desde el webhook si aún está en SENT
        // (evitamos pisar un estado ya definitivo)
        if (status === 'FAILED' || status === 'UNDELIVERED') {
            const errorMsg = msg['whatsappApiError']?.message ?? `Delivery failed: ${status}`;
            await this.recipientModel.updateOne({ _id: recipientId, status: 'SENT' }, { $set: { status: 'FAILED', errorMessage: errorMsg } });
        }
        this.logger.debug(`Webhook: recipient ${externalId} → ${status}`);
    }
};
exports.MarketingService = MarketingService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketingService.prototype, "processPendingRecipients", null);
exports.MarketingService = MarketingService = MarketingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)('Campaign')),
    __param(1, (0, mongoose_1.InjectModel)('CampaignRecipient')),
    __param(2, (0, mongoose_1.InjectModel)('CampaignLog')),
    __param(3, (0, mongoose_1.InjectModel)('DirectMessage')),
    __param(4, (0, mongoose_1.InjectModel)('Customer')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        ycloud_client_1.YCloudClient,
        config_1.ConfigService])
], MarketingService);
//# sourceMappingURL=marketing.service.js.map