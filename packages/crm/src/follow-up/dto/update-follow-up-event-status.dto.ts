import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateFollowUpEventStatusDto {
  @IsEnum(['COMPLETED', 'CANCELLED', 'READY'])
  status!: 'COMPLETED' | 'CANCELLED' | 'READY';

  @IsOptional()
  @IsString()
  notes?: string;
}
