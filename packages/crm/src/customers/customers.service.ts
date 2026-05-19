import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Customer } from './schemas/customer.schema';
import { CustomerFollowUpService } from '../follow-up/customer-follow-up.service';
import { CustomerStatus } from '../follow-up/follow-up.types';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

class CustomValidators {
  static validateMongoId(id: string, fieldName = 'id'): string {
    if (!id) {
      throw new BadRequestException(`El campo '${fieldName}' es requerido`);
    }
    const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!mongoIdRegex.test(id)) {
      throw new BadRequestException(`El campo '${fieldName}' debe ser un ID válido de MongoDB`);
    }
    return id;
  }

  static validateEmail(email: string, fieldName = 'email'): string {
    if (!email) return email;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException(`El campo '${fieldName}' debe tener un formato de email válido`);
    }
    return email;
  }

  static validatePhone(phone: string, fieldName = 'telefono'): string {
    if (!phone) return phone;
    let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    cleanPhone = CustomValidators.normalizeArgentinePhone(cleanPhone);
    if (!/^\d{8,15}$/.test(cleanPhone)) {
      throw new BadRequestException(`El campo '${fieldName}' debe contener entre 8 y 15 dígitos`);
    }
    return cleanPhone;
  }

  private static normalizeArgentinePhone(phone: string): string {
    if (phone.startsWith('+549')) return phone.substring(4);
    if (phone.startsWith('549')) return phone.substring(3);
    if (phone.startsWith('+54')) return phone.substring(3);
    if (phone.startsWith('54')) return phone.substring(2);
    if (phone.startsWith('0')) return phone.substring(1);
    return phone;
  }

  static validateEnum(value: any, validOptions: string[], fieldName: string): string {
    if (!validOptions.includes(value)) {
      throw new BadRequestException(
        `El campo '${fieldName}' debe ser uno de: ${validOptions.join(', ')}`,
      );
    }
    return value;
  }

  static sanitizeText(text: string): string {
    if (!text) return text;
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .trim();
  }
}

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectModel('Customer') private readonly clientModel: Model<Customer>,
    private readonly followUpService: CustomerFollowUpService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateCustomerDto) {
    try {
      this.validateClientData(dto);

      let isReconsulta = false;
      if (dto.telefono) {
        const existingClient = await this.clientModel.findOne({
          telefono: dto.telefono,
        });
        if (existingClient) {
          isReconsulta = true;
          this.logger.log(
            `Reconsulta detectada para el teléfono ${dto.telefono}, cliente original ${existingClient._id}`,
          );
        }
      }

      dto.isReconsulta = isReconsulta;

      const createdCustomer = await this.clientModel.create(dto);

      if (!createdCustomer) {
        throw new BadRequestException('No se pudo crear el cliente');
      }

      this.logger.log(`Cliente creado exitosamente: ${createdCustomer._id}`);

      await this.scheduleFollowUpSafely(createdCustomer as Customer, null);

      return createdCustomer;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(`Error al crear cliente: ${(error as Error).message}`, (error as Error).stack);

      if ((error as any).name === 'ValidationError') {
        throw new BadRequestException(
          `Datos de cliente inválidos: ${(error as Error).message}`,
        );
      }

      throw new InternalServerErrorException(
        'Error interno al crear el cliente. Por favor, intente nuevamente.',
      );
    }
  }

  async findAll() {
    try {
      const clients = await this.clientModel.find().lean().sort({ createdAt: -1 });
      this.logger.log(`Se obtuvieron ${clients.length} clientes`);
      return clients;
    } catch (error) {
      this.logger.error(`Error al obtener clientes: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException(
        'Error al cargar la lista de clientes. Por favor, intente nuevamente.',
      );
    }
  }

  async findOne(id: string) {
    try {
      CustomValidators.validateMongoId(id, 'id');

      const client = await this.clientModel.findById(id).lean();

      if (!client) {
        throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
      }

      return client;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(`Error al buscar cliente ${id}: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException(
        'Error al buscar el cliente. Por favor, intente nuevamente.',
      );
    }
  }

  async update(id: string, dto: UpdateCustomerDto) {
    try {
      CustomValidators.validateMongoId(id, 'id');

      if (Object.keys(dto).length > 0) {
        this.validateClientData(dto, true);
      }

      if (dto.telefono) {
        const existingClient = await this.clientModel.findOne({
          telefono: dto.telefono,
          _id: { $ne: id },
        });
        if (existingClient) {
          throw new BadRequestException(
            `Ya existe otro cliente con el teléfono ${dto.telefono}`,
          );
        }
      }

      const currentClient = await this.clientModel.findById(id).lean();

      if (!currentClient) {
        throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
      }

      const previousStatus = currentClient.estado as CustomerStatus | undefined;

      const updated = await this.clientModel
        .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
        .lean();

      if (!updated) {
        throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
      }

      this.logger.log(`Cliente actualizado exitosamente: ${id}`);

      await this.scheduleFollowUpSafely(updated as unknown as Customer, previousStatus ?? null);

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(`Error al actualizar cliente ${id}: ${(error as Error).message}`, (error as Error).stack);

      if ((error as any).name === 'ValidationError') {
        throw new BadRequestException(
          `Datos de cliente inválidos: ${(error as Error).message}`,
        );
      }

      throw new InternalServerErrorException(
        'Error interno al actualizar el cliente. Por favor, intente nuevamente.',
      );
    }
  }

  async remove(id: string) {
    try {
      CustomValidators.validateMongoId(id, 'id');

      const deletedClient = await this.clientModel.findByIdAndDelete(id);

      if (!deletedClient) {
        throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
      }

      this.logger.log(`Cliente eliminado exitosamente: ${id}`);
      return { message: 'Cliente eliminado correctamente', id };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(`Error al eliminar cliente ${id}: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException(
        'Error interno al eliminar el cliente. Por favor, intente nuevamente.',
      );
    }
  }

  /**
   * Normaliza números de teléfono argentinos
   */
  private normalizeArgentinePhone(phone: string): string {
    if (!phone) return phone;

    let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    if (cleanPhone.startsWith('+549')) {
      return cleanPhone.substring(4);
    }
    if (cleanPhone.startsWith('549')) {
      return cleanPhone.substring(3);
    }
    if (cleanPhone.startsWith('+54')) {
      return cleanPhone.substring(3);
    }
    if (cleanPhone.startsWith('54')) {
      return cleanPhone.substring(2);
    }
    if (cleanPhone.startsWith('0')) {
      return cleanPhone.substring(1);
    }

    return cleanPhone;
  }

  /**
   * Limpia datos del CRM removiendo placeholders y valores inválidos
   */
  private cleanCrmData(value: any): any {
    if (!value || value === null || value === undefined) {
      return null;
    }

    const stringValue = String(value).trim();

    if (stringValue === '') {
      return null;
    }

    if (
      stringValue.includes('{{cuf_') ||
      stringValue.includes('{{') ||
      stringValue.includes('}}') ||
      stringValue.match(/^\{\{[^}]+\}\}$/)
    ) {
      return null;
    }

    if (stringValue.match(/^[a-zA-Z_]+_\d+$/) && stringValue.length > 10) {
      return null;
    }

    const genericValues = [
      'null', 'undefined', 'N/A', 'n/a', 'NA', 'na',
      'sin datos', 'sin informacion', 'no disponible',
      'placeholder', 'test', 'ejemplo', 'demo',
    ];

    if (genericValues.includes(stringValue.toLowerCase())) {
      return null;
    }

    return stringValue;
  }

  /**
   * Valida los datos del cliente
   */
  private validateClientData(dto: any, isUpdate: boolean = false): void {
    if (dto.nombre !== undefined) {
      dto.nombre = this.cleanCrmData(dto.nombre);
      if (!dto.nombre) {
        throw new BadRequestException('El nombre es requerido y no puede estar vacío');
      }
      dto.nombre = CustomValidators.sanitizeText(dto.nombre);
    }

    if (dto.apellido !== undefined) {
      dto.apellido = this.cleanCrmData(dto.apellido);
      if (dto.apellido) {
        dto.apellido = CustomValidators.sanitizeText(dto.apellido);
      }
    }

    if (dto.telefono !== undefined) {
      dto.telefono = this.cleanCrmData(dto.telefono);
      if (dto.telefono) {
        dto.telefono = this.normalizeArgentinePhone(dto.telefono);
        dto.telefono = CustomValidators.validatePhone(dto.telefono);
      }
    }

    if (dto.correo !== undefined) {
      dto.correo = this.cleanCrmData(dto.correo);
      if (dto.correo) {
        dto.correo = CustomValidators.validateEmail(dto.correo);
      }
    }

    if (dto.cabezas !== undefined) {
      dto.cabezas = this.cleanCrmData(dto.cabezas);
      if (dto.cabezas) {
        dto.cabezas = CustomValidators.sanitizeText(dto.cabezas);
      }
    }

    if (dto.mesesSuplemento !== undefined) {
      dto.mesesSuplemento = this.cleanCrmData(dto.mesesSuplemento);
      if (dto.mesesSuplemento) {
        dto.mesesSuplemento = CustomValidators.sanitizeText(dto.mesesSuplemento);
      }
    }

    if (dto.actividad !== undefined) {
      dto.actividad = this.cleanCrmData(dto.actividad);
      if (dto.actividad) {
        const actividadesValidas = ['CRIA', 'RECRIA', 'MIXTO', 'DISTRIBUIDOR'];
        dto.actividad = CustomValidators.validateEnum(dto.actividad, actividadesValidas, 'actividad');
      }
    }

    if (dto.medioAdquisicion !== undefined) {
      dto.medioAdquisicion = this.cleanCrmData(dto.medioAdquisicion);
      if (dto.medioAdquisicion) {
        const mediosValidos = ['INSTAGRAM', 'WEB', 'WHATSAPP', 'FACEBOOK', 'OTRO'];
        dto.medioAdquisicion = CustomValidators.validateEnum(dto.medioAdquisicion, mediosValidos, 'medioAdquisicion');
      }
    }

    if (dto.estado !== undefined) {
      dto.estado = this.cleanCrmData(dto.estado);
      if (dto.estado) {
        const estadosValidos = ['PENDIENTE', 'NO_CONTESTO', 'SE_COTIZO_Y_PENDIENTE', 'SE_COTIZO_Y_NO_INTERESO', 'DERIVADO_A_DISTRIBUIDOR', 'COMPRO'];
        dto.estado = CustomValidators.validateEnum(dto.estado, estadosValidos, 'estado');
      }
    }

    if (dto.siguiendo !== undefined) {
      dto.siguiendo = this.cleanCrmData(dto.siguiendo);
      if (dto.siguiendo) {
        const validAdvisors = this.config
          .get<string>('CRM_ADVISORS', 'EZEQUIEL,DENIS,MARTIN')
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .concat(['SIN_ASIGNAR']);
        dto.siguiendo = CustomValidators.validateEnum(dto.siguiendo, validAdvisors, 'siguiendo');
      }
    }

    if (dto.observaciones !== undefined) {
      dto.observaciones = this.cleanCrmData(dto.observaciones);
      if (dto.observaciones) {
        dto.observaciones = CustomValidators.sanitizeText(dto.observaciones);
      }
    }

    if (dto.producto !== undefined) {
      dto.producto = this.cleanCrmData(dto.producto);
      if (dto.producto) {
        dto.producto = CustomValidators.sanitizeText(dto.producto);
      }
    }

    if (dto.localidad !== undefined) {
      dto.localidad = this.cleanCrmData(dto.localidad);
      if (dto.localidad) {
        dto.localidad = CustomValidators.sanitizeText(dto.localidad);
      }
    }

    if (dto.provincia !== undefined) {
      dto.provincia = this.cleanCrmData(dto.provincia);
      if (dto.provincia) {
        dto.provincia = CustomValidators.sanitizeText(dto.provincia);
      }
    }

    if (dto.ubicacion !== undefined) {
      const ubicacion = dto.ubicacion ?? {};

      if (ubicacion.pais !== undefined) {
        ubicacion.pais = this.cleanCrmData(ubicacion.pais);
        if (ubicacion.pais) {
          ubicacion.pais = CustomValidators.sanitizeText(ubicacion.pais);
        }
      }

      if (ubicacion.provincia !== undefined) {
        ubicacion.provincia = this.cleanCrmData(ubicacion.provincia);
        if (ubicacion.provincia) {
          ubicacion.provincia = CustomValidators.sanitizeText(ubicacion.provincia);
        }
      }

      if (ubicacion.localidad !== undefined) {
        ubicacion.localidad = this.cleanCrmData(ubicacion.localidad);
        if (ubicacion.localidad) {
          ubicacion.localidad = CustomValidators.sanitizeText(ubicacion.localidad);
        }
      }

      if (ubicacion.zona !== undefined) {
        ubicacion.zona = this.cleanCrmData(ubicacion.zona);
        if (ubicacion.zona) {
          ubicacion.zona = CustomValidators.sanitizeText(ubicacion.zona);
        }
      }

      if (ubicacion.displayName !== undefined) {
        ubicacion.displayName = this.cleanCrmData(ubicacion.displayName);
        if (ubicacion.displayName) {
          ubicacion.displayName = CustomValidators.sanitizeText(ubicacion.displayName);
        }
      }

      dto.ubicacion = ubicacion;
    }
  }

  private async scheduleFollowUpSafely(
    customer: Customer,
    previousStatus: CustomerStatus | null,
  ): Promise<void> {
    if (!customer) {
      return;
    }

    try {
      await this.followUpService.scheduleForStatusChange(customer, previousStatus);
    } catch (error) {
      const message = (error as Error)?.message ?? 'Error desconocido al programar seguimiento';
      this.logger.warn(
        `No se pudo programar el seguimiento automático para el cliente ${customer._id?.toString?.() ?? 'sin-id'}: ${message}`,
        (error as Error)?.stack,
      );
    }
  }

  async generateExcel(res: Response): Promise<void> {
    const clients = await this.clientModel.find();
    if (!clients || clients.length === 0) {
      throw new NotFoundException('No hay clientes para exportar');
    }

    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Tu App CRM';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Clientes');

    sheet.columns = [
      { header: 'Nombre', key: 'nombre', width: 25 },
      { header: 'Apellido', key: 'apellido', width: 25 },
      { header: 'Teléfono', key: 'telefono', width: 20 },
      { header: 'Email', key: 'correo', width: 30 },
      { header: 'Actividad', key: 'actividad', width: 15 },
      { header: 'Siguiendo', key: 'siguiendo', width: 15 },
      { header: 'Estado', key: 'estado', width: 20 },
      { header: 'Creado El', key: 'createdAt', width: 20 },
      { header: 'Producto', key: 'producto', width: 25 },
      { header: 'Localidad', key: 'localidad', width: 20 },
      { header: 'Cabezas', key: 'cabezas', width: 10 },
      { header: 'Meses Supl.', key: 'mesesSuplemento', width: 12 },
      { header: 'Medio Adq.', key: 'medioAdquisicion', width: 15 },
      { header: 'Observaciones', key: 'observaciones', width: 40 },
    ];

    clients.forEach((c: any) => {
      let createdAtStr = '-';
      if (c.createdAt) {
        const d = new Date(c.createdAt);
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        createdAtStr = `${yyyy}/${mm}/${dd}`;
      }

      sheet.addRow({
        nombre: c.nombre || '',
        apellido: c.apellido || '',
        telefono: c.telefono || '',
        correo: c.correo || '',
        actividad: c.actividad || '',
        siguiendo: c.siguiendo || '',
        estado: c.estado || '',
        createdAt: createdAtStr,
        producto: c.producto || '',
        localidad: c.localidad || '',
        cabezas: c.cabezas || '',
        mesesSuplemento: c.mesesSuplemento || '',
        medioAdquisicion: c.medioAdquisicion || '',
        observaciones: c.observaciones || '',
      });
    });

    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEEEEEE' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="clientes_completos.xlsx"',
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
