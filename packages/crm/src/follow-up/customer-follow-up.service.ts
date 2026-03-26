import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import { Customer } from '../customers/schemas/customer.schema';
import { FollowUpTask } from './schemas/follow-up-task.schema';
import {
  CUSTOMER_FOLLOW_UP_RULES,
  FOLLOW_UP_SUBJECTS,
  FOLLOW_UP_TEMPLATE_BUILDERS,
  FollowUpDeliveryOption,
} from './follow-up.rules';
import { CustomerStatus, FollowUpTemplateId } from './follow-up.types';
import { MessagingGateway } from './messaging/messaging.gateway';
import { MessagePayload } from './messaging/message-channel.interface';
import { FollowUpEventsService } from './follow-up-events.service';
import { FollowUpEvent } from './schemas/follow-up-event.schema';

@Injectable()
export class CustomerFollowUpService {
  private readonly logger = new Logger(CustomerFollowUpService.name);

  constructor(
    @InjectModel('FollowUpTask')
    private readonly taskModel: Model<FollowUpTask>,
    @InjectModel('Customer')
    private readonly clientModel: Model<Customer>,
    private readonly followUpEventsService: FollowUpEventsService,
    private readonly messagingGateway: MessagingGateway,
    private readonly config: ConfigService,
  ) {}

  private isAutomationEnabled(): boolean {
    return this.config.get<string>('FOLLOW_UP_AUTOMATION_ENABLED', 'false') === 'true';
  }

  async scheduleForStatusChange(
    customer: Customer,
    previousStatus?: CustomerStatus | null,
  ): Promise<void> {
    const newStatus = (customer.estado as CustomerStatus) ?? null;

    if (!newStatus) {
      return;
    }

    if (previousStatus && previousStatus === newStatus) {
      return;
    }

    await this.cancelPendingTasks(customer._id as Types.ObjectId);

    const rule = CUSTOMER_FOLLOW_UP_RULES[newStatus];

    if (!rule) {
      this.logger.debug(`No follow-up rule defined for status ${newStatus}`);
      return;
    }

    // Siempre programar el evento, incluso si no hay canales activos
    // Esto permite que aparezca en la UI de eventos para manejo manual
    if (!rule.delivery || rule.delivery.length === 0) {
      this.logger.warn(
        `Follow-up rule ${rule.templateId} for status ${newStatus} has no delivery options. Event will be scheduled for manual handling.`,
      );
    }

    const executeAt = new Date(Date.now() + rule.delayMs);
    const messageBody = this.buildMessage(rule.templateId, customer);
    const deliveryHint = this.resolveDeliveryOption(customer, rule.delivery);

    const followUpEvent = await this.followUpEventsService.createEvent({
      customerId: customer._id as Types.ObjectId,
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
      this.logger.log(
        `Follow-up event ${followUpEvent._id.toString()} scheduled for manual handling (automation disabled or no active channels).`,
      );

      // Marcar evento como READY para que aparezca en el frontend
      await this.followUpEventsService.upsertManualStatus(
        followUpEvent._id.toString(),
        'READY',
        'No automation available - manual handling required',
      );

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

    await this.followUpEventsService.linkTaskToEvent(
      followUpEvent._id as Types.ObjectId,
      task._id as Types.ObjectId,
    );

    this.logger.log(
      `Scheduled follow-up ${rule.templateId} for customer ${customer._id.toString()} at ${executeAt.toISOString()}`,
    );
  }

  private async cancelPendingTasks(customerId: Types.ObjectId): Promise<void> {
    await this.taskModel.updateMany(
      { customerId, status: 'PENDING' },
      {
        $set: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          error: 'Cancelled due to status change',
        },
      },
    );

    await this.followUpEventsService.cancelOpenEventsForCustomer(customerId);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processDueTasks(): Promise<void> {
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
      await this.processTask(task._id as Types.ObjectId);
    }
  }

  private async processTask(taskId: Types.ObjectId): Promise<void> {
    const task = await this.taskModel.findOneAndUpdate(
      { _id: taskId, status: 'PENDING' },
      {
        $set: { status: 'PROCESSING' },
        $inc: { attempts: 1 },
      },
      { new: true },
    );

    if (!task) {
      return;
    }

    let deliveryResolution: ReturnType<typeof this.resolveDeliveryOption> | null = null;

    try {
      const customer = await this.clientModel.findById(task.customerId).lean() as unknown as Customer | null;

      if (!customer) {
        await this.markTaskAs(task._id as Types.ObjectId, 'FAILED', 'Cliente no encontrado');
        await this.syncEventStatusFromTask(task, 'FAILED', 'Cliente no encontrado');
        return;
      }

      deliveryResolution = this.resolveDeliveryOption(customer, task.delivery);

      if (!deliveryResolution) {
        await this.markTaskAs(
          task._id as Types.ObjectId,
          'SKIPPED',
          'No se encontró un dato de contacto compatible con las opciones configuradas',
        );
        await this.syncEventStatusFromTask(
          task,
          'SKIPPED',
          'No se encontró un dato de contacto compatible con las opciones configuradas',
        );
        return;
      }

      const messageBody = this.buildMessage(task.templateId, customer);
      const subject = this.buildSubject(task.templateId);

      const payload: MessagePayload = {
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

      await this.taskModel.updateOne(
        { _id: task._id },
        {
          $set: {
            status: 'SENT',
            processedAt: new Date(),
            selectedOptionIndex: deliveryResolution.optionIndex,
            error: undefined,
          },
        },
      );
      await this.syncEventStatusFromTask(task, 'SENT');

      // Enviar correo de confirmación al asesor
      await this.sendTaskResultEmail(task, customer, 'SENT', null);
    } catch (error: any) {
      const message =
        error?.message ?? 'Error desconocido al enviar la tarea de seguimiento';

      // Manejo específico para errores de WhatsApp WebJS
      if (message.includes('WhatsApp WebJS client no está listo')) {
        this.logger.warn(
          `WhatsApp WebJS no está disponible para la tarea ${task._id.toString()}. Reintentando en el próximo ciclo.`,
        );

        await this.taskModel.updateOne(
          { _id: task._id },
          {
            $set: {
              status: 'PENDING',
              executeAt: new Date(Date.now() + 5 * 60 * 1000),
              error: 'WhatsApp WebJS no disponible - reintentando',
            },
            $inc: { attempts: -1 },
          },
        );
        return;
      }

      this.logger.error(
        `Failed to process follow-up task ${task._id.toString()}: ${message}`,
        error?.stack,
      );
      await this.markTaskAs(task._id as Types.ObjectId, 'FAILED', message);
      await this.syncEventStatusFromTask(task, 'FAILED', message);

      // Enviar correo de fallo al asesor
      const customer = await this.clientModel.findById(task.customerId).lean() as unknown as Customer | null;
      if (customer) {
        await this.sendTaskResultEmail(task, customer, 'FAILED', message);
      }
    }
  }

  private buildMessage(templateId: FollowUpTemplateId, customer: Customer): string {
    const builder = FOLLOW_UP_TEMPLATE_BUILDERS[templateId];

    if (!builder) {
      throw new Error(`No hay plantilla configurada para ${templateId}`);
    }

    return builder({ nombre: customer.nombre, producto: customer.producto });
  }

  private buildSubject(templateId: FollowUpTemplateId): string | undefined {
    return FOLLOW_UP_SUBJECTS[templateId];
  }

  private async markTaskAs(
    taskId: Types.ObjectId,
    status: 'SENT' | 'FAILED' | 'SKIPPED' | 'CANCELLED',
    errorMessage?: string,
  ): Promise<void> {
    await this.taskModel.updateOne(
      { _id: taskId },
      {
        $set: {
          status,
          processedAt: new Date(),
          error: errorMessage,
          cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
        },
      },
    );
  }

  private async notifyAssigneeForManualEvent(event: FollowUpEvent): Promise<void> {
    const { email, displayName } = this.resolveAssigneeEmail(event.assignedTo);

    if (!email) {
      this.logger.warn(
        `No notification email configured for assignee ${event.assignedTo ?? 'sin asignar'} (event ${
          event._id?.toString?.() ?? 'n/a'
        }).`,
      );
      return;
    }

    const customerFullName = [event.customerName, event.customerLastName]
      .filter((value) => Boolean(value && value.trim().length > 0))
      .join(' ')
      .trim();

    const statusLabel = this.humanizeStatus(event.triggerStatus);
    const channelList =
      event.channels && event.channels.length > 0
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
    ].filter((line): line is string => line !== null);

    const payload: MessagePayload = {
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
      this.logger.log(
        `Manual follow-up notification sent to ${email} for event ${event._id?.toString?.() ?? 'n/a'}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send manual follow-up notification to ${email}: ${error?.message ?? 'unknown error'}`,
        error?.stack,
      );
    }
  }

  private async sendTaskResultEmail(
    task: FollowUpTask,
    customer: Customer,
    result: 'SENT' | 'FAILED',
    errorMessage?: string | null,
  ): Promise<void> {
    const { email, displayName } = this.resolveAssigneeEmail(customer.siguiendo);

    if (!email) {
      this.logger.warn(
        `No notification email configured for assignee ${customer.siguiendo ?? 'sin asignar'} (task ${
          task._id?.toString?.() ?? 'n/a'
        }).`,
      );
      return;
    }

    const customerFullName = [customer.nombre, customer.apellido]
      .filter((value) => Boolean(value && value.trim().length > 0))
      .join(' ')
      .trim();

    const statusLabel = this.humanizeStatus(task.triggerStatus);
    const scheduledDate = this.formatDateTime(task.executeAt);
    const contactValue = customer.telefono || customer.correo || 'Sin contacto';

    const subject =
      result === 'SENT'
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
    ].filter((line): line is string => line !== null);

    const payload: MessagePayload = {
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
      this.logger.log(
        `Task result email sent to ${email} for task ${task._id?.toString?.() ?? 'n/a'} (${result})`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send task result email to ${email}: ${error?.message ?? 'unknown error'}`,
        error?.stack,
      );
    }
  }

  private resolveAssigneeEmail(
    assignedTo?: string | null,
  ): { email: string | null; displayName: string } {
    const normalized = (assignedTo ?? 'SIN_ASIGNAR').toUpperCase();

    const mailerEmail = this.config.get<string>('MAILER_EMAIL', '');

    const map: Record<string, { email?: string; displayName: string }> = {
      EZEQUIEL: {
        email: this.config.get<string>('CRM_ADVISOR_EZEQUIEL_EMAIL', ''),
        displayName: 'Ezequiel',
      },
      DENIS: {
        email: this.config.get<string>('CRM_ADVISOR_DENIS_EMAIL', ''),
        displayName: 'Denis',
      },
      MARTIN: {
        email: this.config.get<string>('CRM_ADVISOR_MARTIN_EMAIL', ''),
        displayName: 'Martín',
      },
      SIN_ASIGNAR: {
        email: this.config.get<string>('CRM_ADVISOR_SIN_ASIGNAR_EMAIL', ''),
        displayName: 'equipo comercial',
      },
    };

    const entry = map[normalized] ?? {
      email: undefined,
      displayName: normalized.charAt(0) + normalized.slice(1).toLowerCase(),
    };

    const defaultEmail = this.config.get<string>('CRM_ADVISOR_DEFAULT_EMAIL', '');
    const sinAsignarEmail = this.config.get<string>('CRM_ADVISOR_SIN_ASIGNAR_EMAIL', '');

    const fallbackEmail =
      entry.email ||
      defaultEmail ||
      sinAsignarEmail ||
      mailerEmail ||
      null;

    return {
      email: fallbackEmail && fallbackEmail.trim().length > 0 ? fallbackEmail : null,
      displayName: entry.displayName,
    };
  }

  private humanizeStatus(status: string | undefined | null): string {
    if (!status) {
      return 'Sin estado';
    }

    return status
      .split('_')
      .map((fragment) => fragment.charAt(0) + fragment.slice(1).toLowerCase())
      .join(' ');
  }

  private formatDateTime(date?: Date | string | null): string {
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

  private formatTime(date?: Date | string | null): string | null {
    if (!date) {
      return null;
    }

    const target = date instanceof Date ? date : new Date(date);

    return new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(target);
  }

  private buildContactLine(event: FollowUpEvent): string | null {
    const details: string[] = [];

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

  private async syncEventStatusFromTask(
    task: FollowUpTask,
    status: 'SENT' | 'FAILED' | 'SKIPPED' | 'CANCELLED',
    notes?: string,
  ): Promise<void> {
    if (!task.eventId) {
      return;
    }

    const eventId = task.eventId as Types.ObjectId;

    if (status === 'SENT') {
      await this.followUpEventsService.markEventCompleted(eventId, new Date(), notes);
      return;
    }

    if (status === 'CANCELLED') {
      await this.followUpEventsService.markEventCancelled(eventId, notes);
      return;
    }

    await this.followUpEventsService.upsertManualStatus(
      eventId.toString(),
      'READY',
      notes,
    );
  }

  private resolveDeliveryOption(
    customer: Customer,
    options: FollowUpDeliveryOption[],
  ): { value: string; optionIndex: number; option: FollowUpDeliveryOption } | null {
    for (let index = 0; index < options.length; index += 1) {
      const option = options[index];
      const value = this.extractContactValueForChannel(
        customer,
        option.channel,
        option.contactPreference,
      );

      if (value) {
        return { value, optionIndex: index, option };
      }
    }

    return null;
  }

  private extractContactValue(
    customer: Customer,
    preference: FollowUpDeliveryOption['contactPreference'],
  ): string | null {
    if (preference === 'EMAIL') {
      return customer.correo ?? null;
    }

    if (preference === 'PHONE') {
      const phone = customer.telefono ?? null;
      return this.normalizePhoneForWhatsApp(phone);
    }

    return null;
  }

  private extractContactValueForChannel(
    customer: Customer,
    _channel: string,
    preference: FollowUpDeliveryOption['contactPreference'],
  ): string | null {
    return this.extractContactValue(customer, preference);
  }

  /**
   * Normaliza el teléfono para WhatsApp WebJS
   */
  private normalizePhoneForWhatsApp(phone: string | null): string | null {
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
}
