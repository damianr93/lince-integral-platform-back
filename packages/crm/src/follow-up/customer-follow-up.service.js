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
var CustomerFollowUpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerFollowUpService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const mongoose_2 = require("mongoose");
const follow_up_rules_1 = require("./follow-up.rules");
const messaging_gateway_1 = require("./messaging/messaging.gateway");
const follow_up_events_service_1 = require("./follow-up-events.service");
let CustomerFollowUpService = CustomerFollowUpService_1 = class CustomerFollowUpService {
    constructor(taskModel, clientModel, followUpEventsService, messagingGateway, config) {
        this.taskModel = taskModel;
        this.clientModel = clientModel;
        this.followUpEventsService = followUpEventsService;
        this.messagingGateway = messagingGateway;
        this.config = config;
        this.logger = new common_1.Logger(CustomerFollowUpService_1.name);
    }
    isAutomationEnabled() {
        return this.config.get('FOLLOW_UP_AUTOMATION_ENABLED', 'false') === 'true';
    }
    async scheduleForStatusChange(customer, previousStatus) {
        const newStatus = customer.estado ?? null;
        if (!newStatus) {
            return;
        }
        if (previousStatus && previousStatus === newStatus) {
            return;
        }
        await this.cancelPendingTasks(customer._id);
        const rule = follow_up_rules_1.CUSTOMER_FOLLOW_UP_RULES[newStatus];
        if (!rule) {
            this.logger.debug(`No follow-up rule defined for status ${newStatus}`);
            return;
        }
        // Siempre programar el evento, incluso si no hay canales activos
        // Esto permite que aparezca en la UI de eventos para manejo manual
        if (!rule.delivery || rule.delivery.length === 0) {
            this.logger.warn(`Follow-up rule ${rule.templateId} for status ${newStatus} has no delivery options. Event will be scheduled for manual handling.`);
        }
        const executeAt = new Date(Date.now() + rule.delayMs);
        const messageBody = this.buildMessage(rule.templateId, customer);
        const deliveryHint = this.resolveDeliveryOption(customer, rule.delivery);
        const followUpEvent = await this.followUpEventsService.createEvent({
            customerId: customer._id,
            customerName: customer.nombre,
            customerLastName: customer.apellido,
            customerPhone: customer.telefono,
            customerEmail: customer.correo,
            assignedTo: customer.siguiendo,
            product: customer.producto,
            triggerStatus: newStatus,
            templateId: rule.templateId,
            message: messageBody,
            channels: rule.delivery.map((option) => option.channel),
            contactValue: deliveryHint?.value ?? null,
            scheduledFor: executeAt,
        });
        if (!this.isAutomationEnabled() || !rule.delivery || rule.delivery.length === 0) {
            this.logger.log(`Follow-up event ${followUpEvent._id.toString()} scheduled for manual handling (automation disabled or no active channels).`);
            // Marcar evento como READY para que aparezca en el frontend
            await this.followUpEventsService.upsertManualStatus(followUpEvent._id.toString(), 'READY', 'No automation available - manual handling required');
            return;
        }
        const task = await this.taskModel.create({
            customerId: customer._id,
            executeAt,
            triggerStatus: newStatus,
            templateId: rule.templateId,
            delivery: rule.delivery,
            status: 'PENDING',
            eventId: followUpEvent._id,
        });
        await this.followUpEventsService.linkTaskToEvent(followUpEvent._id, task._id);
        this.logger.log(`Scheduled follow-up ${rule.templateId} for customer ${customer._id.toString()} at ${executeAt.toISOString()}`);
    }
    async cancelPendingTasks(customerId) {
        await this.taskModel.updateMany({ customerId, status: 'PENDING' }, {
            $set: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                error: 'Cancelled due to status change',
            },
        });
        await this.followUpEventsService.cancelOpenEventsForCustomer(customerId);
    }
    async processDueTasks() {
        const now = new Date();
        if (!this.isAutomationEnabled()) {
            const readyEvents = await this.followUpEventsService.markDueEventsAsReady(now);
            for (const event of readyEvents) {
                await this.notifyAssigneeForManualEvent(event);
            }
            return;
        }
        const dueTasks = await this.taskModel
            .find({ status: 'PENDING', executeAt: { $lte: now } })
            .sort({ executeAt: 1 })
            .limit(20)
            .lean();
        for (const task of dueTasks) {
            await this.processTask(task._id);
        }
    }
    async processTask(taskId) {
        const task = await this.taskModel.findOneAndUpdate({ _id: taskId, status: 'PENDING' }, {
            $set: { status: 'PROCESSING' },
            $inc: { attempts: 1 },
        }, { new: true });
        if (!task) {
            return;
        }
        let deliveryResolution = null;
        try {
            const customer = await this.clientModel.findById(task.customerId).lean();
            if (!customer) {
                await this.markTaskAs(task._id, 'FAILED', 'Cliente no encontrado');
                await this.syncEventStatusFromTask(task, 'FAILED', 'Cliente no encontrado');
                return;
            }
            deliveryResolution = this.resolveDeliveryOption(customer, task.delivery);
            if (!deliveryResolution) {
                await this.markTaskAs(task._id, 'SKIPPED', 'No se encontró un dato de contacto compatible con las opciones configuradas');
                await this.syncEventStatusFromTask(task, 'SKIPPED', 'No se encontró un dato de contacto compatible con las opciones configuradas');
                return;
            }
            const messageBody = this.buildMessage(task.templateId, customer);
            const subject = this.buildSubject(task.templateId);
            const payload = {
                recipient: deliveryResolution.value,
                body: messageBody,
                subject: subject,
                metadata: {
                    customerId: customer._id?.toString(),
                    customerName: customer.nombre,
                    customerLastName: customer.apellido,
                    templateId: task.templateId,
                    status: customer.estado,
                    advisor: customer.siguiendo,
                },
            };
            await this.messagingGateway.dispatch(deliveryResolution.option.channel, payload);
            await this.taskModel.updateOne({ _id: task._id }, {
                $set: {
                    status: 'SENT',
                    processedAt: new Date(),
                    selectedOptionIndex: deliveryResolution.optionIndex,
                    error: undefined,
                },
            });
            await this.syncEventStatusFromTask(task, 'SENT');
            // Enviar correo de confirmación al asesor
            await this.sendTaskResultEmail(task, customer, 'SENT', null);
        }
        catch (error) {
            const message = error?.message ?? 'Error desconocido al enviar la tarea de seguimiento';
            // Manejo específico para errores de WhatsApp WebJS
            if (message.includes('WhatsApp WebJS client no está listo')) {
                this.logger.warn(`WhatsApp WebJS no está disponible para la tarea ${task._id.toString()}. Reintentando en el próximo ciclo.`);
                await this.taskModel.updateOne({ _id: task._id }, {
                    $set: {
                        status: 'PENDING',
                        executeAt: new Date(Date.now() + 5 * 60 * 1000),
                        error: 'WhatsApp WebJS no disponible - reintentando',
                    },
                    $inc: { attempts: -1 },
                });
                return;
            }
            this.logger.error(`Failed to process follow-up task ${task._id.toString()}: ${message}`, error?.stack);
            await this.markTaskAs(task._id, 'FAILED', message);
            await this.syncEventStatusFromTask(task, 'FAILED', message);
            // Enviar correo de fallo al asesor
            const customer = await this.clientModel.findById(task.customerId).lean();
            if (customer) {
                await this.sendTaskResultEmail(task, customer, 'FAILED', message);
            }
        }
    }
    buildMessage(templateId, customer) {
        const builder = follow_up_rules_1.FOLLOW_UP_TEMPLATE_BUILDERS[templateId];
        if (!builder) {
            throw new Error(`No hay plantilla configurada para ${templateId}`);
        }
        return builder({ nombre: customer.nombre, producto: customer.producto });
    }
    buildSubject(templateId) {
        return follow_up_rules_1.FOLLOW_UP_SUBJECTS[templateId];
    }
    async markTaskAs(taskId, status, errorMessage) {
        await this.taskModel.updateOne({ _id: taskId }, {
            $set: {
                status,
                processedAt: new Date(),
                error: errorMessage,
                cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
            },
        });
    }
    async notifyAssigneeForManualEvent(event) {
        const { email, displayName } = this.resolveAssigneeEmail(event.assignedTo);
        if (!email) {
            this.logger.warn(`No notification email configured for assignee ${event.assignedTo ?? 'sin asignar'} (event ${event._id?.toString?.() ?? 'n/a'}).`);
            return;
        }
        const customerFullName = [event.customerName, event.customerLastName]
            .filter((value) => Boolean(value && value.trim().length > 0))
            .join(' ')
            .trim();
        const statusLabel = this.humanizeStatus(event.triggerStatus);
        const channelList = event.channels && event.channels.length > 0
            ? event.channels.map((channel) => channel.replace(/_/g, ' ').toLowerCase()).join(', ')
            : 'Definido en lógica';
        const scheduledDate = this.formatDateTime(event.scheduledFor);
        const readySince = event.readyAt ? this.formatTime(event.readyAt) : null;
        const contactLine = this.buildContactLine(event);
        const subject = `[Seguimiento Manual] ${customerFullName || 'Cliente sin nombre'} • ${statusLabel}`;
        const bodyLines = [
            `Hola ${displayName},`,
            '',
            'Hay un evento de seguimiento manual listo para ejecutar.',
            '',
            `• Cliente: ${customerFullName || 'Cliente sin nombre'}`,
            `• Estado que disparó: ${statusLabel}`,
            `• Producto: ${event.product ?? 'Sin especificar'}`,
            `• Canales sugeridos: ${channelList}`,
            `• Programado para: ${scheduledDate}`,
            readySince ? `• Listo desde: ${readySince}` : null,
            contactLine ? `• Contacto: ${contactLine}` : null,
            '',
            'Mensaje sugerido:',
            '',
            event.message,
            '',
            'Cuando envíes el mensaje, recordá actualizar el seguimiento en el CRM.',
            '',
            '— Equipo de Follow-up Automático',
        ].filter((line) => line !== null);
        const payload = {
            recipient: email,
            subject,
            body: bodyLines.join('\n'),
            metadata: {
                followUpEventId: event._id?.toString(),
                customerId: event.customerId?.toString?.(),
                templateId: event.templateId,
                assignedTo: event.assignedTo,
            },
        };
        try {
            await this.messagingGateway.dispatch('INTERNAL_EMAIL', payload);
            this.logger.log(`Manual follow-up notification sent to ${email} for event ${event._id?.toString?.() ?? 'n/a'}`);
        }
        catch (error) {
            this.logger.error(`Failed to send manual follow-up notification to ${email}: ${error?.message ?? 'unknown error'}`, error?.stack);
        }
    }
    async sendTaskResultEmail(task, customer, result, errorMessage) {
        const { email, displayName } = this.resolveAssigneeEmail(customer.siguiendo);
        if (!email) {
            this.logger.warn(`No notification email configured for assignee ${customer.siguiendo ?? 'sin asignar'} (task ${task._id?.toString?.() ?? 'n/a'}).`);
            return;
        }
        const customerFullName = [customer.nombre, customer.apellido]
            .filter((value) => Boolean(value && value.trim().length > 0))
            .join(' ')
            .trim();
        const statusLabel = this.humanizeStatus(task.triggerStatus);
        const scheduledDate = this.formatDateTime(task.executeAt);
        const contactValue = customer.telefono || customer.correo || 'Sin contacto';
        const subject = result === 'SENT'
            ? `✅ WhatsApp Enviado - ${customerFullName || 'Cliente sin nombre'} • ${statusLabel}`
            : `❌ Fallo en WhatsApp - ${customerFullName || 'Cliente sin nombre'} • ${statusLabel}`;
        const bodyLines = [
            `Hola ${displayName},`,
            '',
            result === 'SENT'
                ? 'El seguimiento automático se ejecutó exitosamente:'
                : 'El seguimiento automático falló y requiere acción manual:',
            '',
            `• Cliente: ${customerFullName || 'Cliente sin nombre'}`,
            `• Estado que disparó: ${statusLabel}`,
            `• Producto: ${customer.producto ?? 'Sin especificar'}`,
            `• Contacto: ${contactValue}`,
            `• Programado para: ${scheduledDate}`,
            result === 'FAILED' && errorMessage ? `• Error: ${errorMessage}` : null,
            '',
            'Mensaje enviado/intentado:',
            '',
            this.buildMessage(task.templateId, customer),
            '',
            result === 'SENT'
                ? 'El cliente recibió el mensaje automáticamente. Puedes hacer seguimiento adicional si necesitas.'
                : 'Por favor, contacta manualmente al cliente usando la información proporcionada.',
            '',
            '— Lince IT',
        ].filter((line) => line !== null);
        const payload = {
            recipient: email,
            subject,
            body: bodyLines.join('\n'),
            metadata: {
                taskId: task._id?.toString(),
                customerId: customer._id?.toString(),
                templateId: task.templateId,
                assignedTo: customer.siguiendo,
                type: 'TASK_RESULT',
                result,
            },
        };
        try {
            await this.messagingGateway.dispatch('INTERNAL_EMAIL', payload);
            this.logger.log(`Task result email sent to ${email} for task ${task._id?.toString?.() ?? 'n/a'} (${result})`);
        }
        catch (error) {
            this.logger.error(`Failed to send task result email to ${email}: ${error?.message ?? 'unknown error'}`, error?.stack);
        }
    }
    resolveAssigneeEmail(assignedTo) {
        const normalized = (assignedTo ?? 'SIN_ASIGNAR').toUpperCase();
        const mailerEmail = this.config.get('MAILER_EMAIL', '');
        const map = {
            EZEQUIEL: {
                email: this.config.get('CRM_ADVISOR_EZEQUIEL_EMAIL', ''),
                displayName: 'Ezequiel',
            },
            DENIS: {
                email: this.config.get('CRM_ADVISOR_DENIS_EMAIL', ''),
                displayName: 'Denis',
            },
            MARTIN: {
                email: this.config.get('CRM_ADVISOR_MARTIN_EMAIL', ''),
                displayName: 'Martín',
            },
            SIN_ASIGNAR: {
                email: this.config.get('CRM_ADVISOR_SIN_ASIGNAR_EMAIL', ''),
                displayName: 'equipo comercial',
            },
        };
        const entry = map[normalized] ?? {
            email: undefined,
            displayName: normalized.charAt(0) + normalized.slice(1).toLowerCase(),
        };
        const defaultEmail = this.config.get('CRM_ADVISOR_DEFAULT_EMAIL', '');
        const sinAsignarEmail = this.config.get('CRM_ADVISOR_SIN_ASIGNAR_EMAIL', '');
        const fallbackEmail = entry.email ||
            defaultEmail ||
            sinAsignarEmail ||
            mailerEmail ||
            null;
        return {
            email: fallbackEmail && fallbackEmail.trim().length > 0 ? fallbackEmail : null,
            displayName: entry.displayName,
        };
    }
    humanizeStatus(status) {
        if (!status) {
            return 'Sin estado';
        }
        return status
            .split('_')
            .map((fragment) => fragment.charAt(0) + fragment.slice(1).toLowerCase())
            .join(' ');
    }
    formatDateTime(date) {
        if (!date) {
            return 'Sin fecha';
        }
        const target = date instanceof Date ? date : new Date(date);
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(target);
    }
    formatTime(date) {
        if (!date) {
            return null;
        }
        const target = date instanceof Date ? date : new Date(date);
        return new Intl.DateTimeFormat('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(target);
    }
    buildContactLine(event) {
        const details = [];
        if (event.customerPhone) {
            details.push(`Tel: ${event.customerPhone}`);
        }
        if (event.customerEmail) {
            details.push(`Email: ${event.customerEmail}`);
        }
        if (event.contactValue && !details.includes(event.contactValue)) {
            details.push(event.contactValue);
        }
        return details.length > 0 ? details.join(' | ') : null;
    }
    async syncEventStatusFromTask(task, status, notes) {
        if (!task.eventId) {
            return;
        }
        const eventId = task.eventId;
        if (status === 'SENT') {
            await this.followUpEventsService.markEventCompleted(eventId, new Date(), notes);
            return;
        }
        if (status === 'CANCELLED') {
            await this.followUpEventsService.markEventCancelled(eventId, notes);
            return;
        }
        await this.followUpEventsService.upsertManualStatus(eventId.toString(), 'READY', notes);
    }
    resolveDeliveryOption(customer, options) {
        for (let index = 0; index < options.length; index += 1) {
            const option = options[index];
            const value = this.extractContactValueForChannel(customer, option.channel, option.contactPreference);
            if (value) {
                return { value, optionIndex: index, option };
            }
        }
        return null;
    }
    extractContactValue(customer, preference) {
        if (preference === 'EMAIL') {
            return customer.correo ?? null;
        }
        if (preference === 'PHONE') {
            const phone = customer.telefono ?? null;
            return this.normalizePhoneForWhatsApp(phone);
        }
        return null;
    }
    extractContactValueForChannel(customer, _channel, preference) {
        return this.extractContactValue(customer, preference);
    }
    /**
     * Normaliza el teléfono para WhatsApp WebJS
     */
    normalizePhoneForWhatsApp(phone) {
        if (!phone) {
            return null;
        }
        let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        if (cleanPhone.startsWith('+549') && cleanPhone.length >= 13) {
            return cleanPhone;
        }
        if (cleanPhone.startsWith('549') && cleanPhone.length >= 12) {
            return `+${cleanPhone}`;
        }
        if (cleanPhone.startsWith('54') && cleanPhone.length >= 11) {
            return `+${cleanPhone}`;
        }
        if (cleanPhone.length >= 10 && !cleanPhone.startsWith('54')) {
            return `+549${cleanPhone}`;
        }
        return null;
    }
};
exports.CustomerFollowUpService = CustomerFollowUpService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CustomerFollowUpService.prototype, "processDueTasks", null);
exports.CustomerFollowUpService = CustomerFollowUpService = CustomerFollowUpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)('FollowUpTask')),
    __param(1, (0, mongoose_1.InjectModel)('Customer')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        follow_up_events_service_1.FollowUpEventsService,
        messaging_gateway_1.MessagingGateway,
        config_1.ConfigService])
], CustomerFollowUpService);
//# sourceMappingURL=customer-follow-up.service.js.map