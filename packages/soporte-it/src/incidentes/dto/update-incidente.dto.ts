import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { EstadoIncidente } from '../../entities/incidente.entity';

export class UpdateIncidenteDto {
  @IsOptional()
  @IsIn(['pending', 'in_progress', 'resolved'])
  estado?: EstadoIncidente;

  @IsOptional()
  @IsUUID()
  reportadoPorId?: string;
}
