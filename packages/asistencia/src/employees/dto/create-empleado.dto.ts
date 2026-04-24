import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Planta } from '../../entities/empleado.entity';

export class CreateEmpleadoDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  dni?: string;

  @IsString()
  @IsNotEmpty()
  pin: string;

  @IsEnum(Planta)
  planta: Planta;

  @IsString()
  @IsOptional()
  departamento?: string;

  @IsString()
  @IsOptional()
  cargo?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
