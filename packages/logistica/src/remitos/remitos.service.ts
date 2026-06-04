import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DocumentEntity, StorageService, UserEntity } from '@lince/database';
import { DocumentType } from '@lince/types';
import { FilterRemitosDto } from './dto/filter-remitos.dto';

export interface RemitoLogistica {
  id: string;
  status: string;
  uploadedByName: string;
  uploadedByEmail: string;
  createdAt: Date;
  latitude: number | null;
  longitude: number | null;
  nroRemito: string | null;
  fecha: string | null;
  cliente: string | null;
}

export interface RemitoDetalle extends RemitoLogistica {
  producto: string | null;
  toneladas: string | null;
  camion: string | null;
  chofer: string | null;
  lugarEntrega: string | null;
  observaciones: string | null;
  viewUrl: string;
  isPdf: boolean;
}

@Injectable()
export class RemitosService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly docRepo: Repository<DocumentEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    private readonly storage: StorageService,
  ) {}

  async findAll(filters: FilterRemitosDto): Promise<{ items: RemitoLogistica[]; total: number; page: number; pages: number; limit: number }> {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 20;

    const qb = this.docRepo.createQueryBuilder('doc')
      .where('doc.type = :type', { type: DocumentType.REMITO })
      .orderBy('doc.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.dateFrom) {
      qb.andWhere('doc.createdAt >= :dateFrom', { dateFrom: new Date(filters.dateFrom) });
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setUTCHours(23, 59, 59, 999);
      qb.andWhere('doc.createdAt <= :dateTo', { dateTo: to });
    }
    if (filters.nroRemito) {
      qb.andWhere(
        "(doc.extracted_data->>'nroRemito' ILIKE :nr OR doc.extracted_data->>'numero' ILIKE :nr)",
        { nr: `%${filters.nroRemito}%` },
      );
    }
    if (filters.status) {
      qb.andWhere('doc.status = :status', { status: filters.status });
    }
    if (filters.uploadedByEmail) {
      const user = await this.userRepo.findOne({ where: { email: filters.uploadedByEmail } });
      qb.andWhere('doc.uploadedBy = :uploadedBy', { uploadedBy: user?.id ?? 'none' });
    }

    const [docs, total] = await qb.getManyAndCount();
    const items = await this.enrichDocs(docs);

    return { items, total, page, pages: Math.ceil(total / limit), limit };
  }

  async findMapa(filters: Partial<FilterRemitosDto> = {}): Promise<RemitoLogistica[]> {
    const qb = this.docRepo.createQueryBuilder('doc')
      .where('doc.type = :type', { type: DocumentType.REMITO })
      .andWhere('doc.latitude IS NOT NULL')
      .andWhere('doc.longitude IS NOT NULL')
      .orderBy('doc.createdAt', 'DESC');

    if (filters.dateFrom) {
      qb.andWhere('doc.createdAt >= :dateFrom', { dateFrom: new Date(filters.dateFrom) });
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setUTCHours(23, 59, 59, 999);
      qb.andWhere('doc.createdAt <= :dateTo', { dateTo: to });
    }
    if (filters.uploadedByEmail) {
      const user = await this.userRepo.findOne({ where: { email: filters.uploadedByEmail } });
      qb.andWhere('doc.uploadedBy = :uploadedBy', { uploadedBy: user?.id ?? 'none' });
    }
    if (filters.cliente) {
      qb.andWhere("doc.extracted_data->>'cliente' ILIKE :cliente", { cliente: `%${filters.cliente}%` });
    }

    const docs = await qb.getMany();
    return this.enrichDocs(docs);
  }

  async findOne(id: string): Promise<RemitoDetalle> {
    const doc = await this.docRepo.findOne({ where: { id, type: DocumentType.REMITO } });
    if (!doc) throw new NotFoundException('Remito no encontrado');

    const user = await this.userRepo.findOne({ where: { id: doc.uploadedBy } });
    const viewUrl = doc.s3Key ? await this.storage.getPresignedViewUrl(doc.s3Key) : '';

    return {
      id: doc.id,
      status: doc.status,
      uploadedByName:  user?.name  ?? doc.uploadedBy,
      uploadedByEmail: user?.email ?? '',
      createdAt:    doc.createdAt,
      latitude:     doc.latitude,
      longitude:    doc.longitude,
      nroRemito:    doc.extractedData?.['nroRemito'] ?? null,
      fecha:        doc.extractedData?.['fecha']     ?? null,
      cliente:      doc.extractedData?.['cliente']   ?? null,
      producto:     doc.extractedData?.['producto']  ?? null,
      toneladas:    doc.extractedData?.['toneladas'] ?? null,
      camion:       doc.extractedData?.['camion']    ?? null,
      chofer:       doc.extractedData?.['chofer']    ?? null,
      lugarEntrega: doc.extractedData?.['lugarEntrega'] ?? null,
      observaciones: doc.observaciones,
      viewUrl,
      isPdf: doc.s3Key?.toLowerCase().endsWith('.pdf') ?? false,
    };
  }

  async getViewUrl(id: string): Promise<{ url: string }> {
    const doc = await this.docRepo.findOne({ where: { id, type: DocumentType.REMITO } });
    if (!doc) throw new NotFoundException('Remito no encontrado');
    const url = doc.s3Key ? await this.storage.getPresignedViewUrl(doc.s3Key) : '';
    return { url };
  }

  async getDownloadUrl(id: string): Promise<string> {
    const doc = await this.docRepo.findOne({ where: { id, type: DocumentType.REMITO } });
    if (!doc) throw new NotFoundException('Remito no encontrado');
    return this.storage.getPresignedDownloadUrl(doc.s3Key);
  }

  private async enrichDocs(docs: DocumentEntity[]): Promise<RemitoLogistica[]> {
    if (!docs.length) return [];

    const userIds = [...new Set(docs.map(d => d.uploadedBy))];
    // TODO-6 [FÁCIL]: ¿existirá este método en la versión de TypeORM que usamos?
    // Buscá en la documentación de TypeORM 0.3.x qué reemplaza a findByIds().
    const users   = await this.userRepo.findBy({ id: In(userIds) });
  
    const userMap = new Map<string, UserEntity>(users.map((u: UserEntity) => [u.id, u]));

    return docs.map(doc => {
      const user = userMap.get(doc.uploadedBy);
      return {
        id:              doc.id,
        status:          doc.status,
        uploadedByName:  user?.name  ?? doc.uploadedBy,
        uploadedByEmail: user?.email ?? '',
        createdAt:       doc.createdAt,
        latitude:        doc.latitude,
        longitude:       doc.longitude,
        nroRemito:       doc.extractedData?.['nroRemito'] ?? null,
        fecha:           doc.extractedData?.['fecha']     ?? null,
        cliente:         doc.extractedData?.['cliente']   ?? null,
      };
    });
  }
}
