import { IsString } from 'class-validator';

export class AddExcludedConceptDto {
  @IsString()
  concept!: string;
}
