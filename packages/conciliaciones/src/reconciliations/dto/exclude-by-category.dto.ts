import { IsString } from 'class-validator';

export class ExcludeByCategoryDto {
  @IsString()
  categoryId!: string;
}
