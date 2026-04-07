import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { UrgenciaIncidente } from '../../entities/incidente.entity';

export class CreateIncidenteDto {
  @IsUUID()
  equipoId: string;

  @IsString()
  @MinLength(10)
  descripcion: string;

  @IsOptional()
  @IsIn(['baja', 'media', 'alta'])
  urgencia?: UrgenciaIncidente;

  @IsOptional()
  @IsDateString()
  fechaReporte?: string;

  @IsOptional()
  @IsString()
  aplicacionesAfectadas?: string;

  @IsOptional()
  @IsString()
  accionesPrevias?: string;
}
