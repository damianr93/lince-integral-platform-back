import { IsEnum, IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { EstadoFichaje } from '../../entities/fichaje.entity';

export class UpdateFichajeDto {
  @IsEnum(EstadoFichaje)
  @IsOptional()
  estado?: EstadoFichaje;

  @IsISO8601()
  @IsOptional()
  tiempo?: string;

  @IsUUID()
  @IsOptional()
  empleadoId?: string | null;
}
