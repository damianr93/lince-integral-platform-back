import { IsEnum, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { Planta } from '../../entities/empleado.entity';

export class ReassignPinDto {
  @IsString()
  pin: string;

  @IsEnum(Planta)
  planta: Planta;

  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  @IsOptional()
  empleadoId: string | null;
}
