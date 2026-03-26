import { IsString } from 'class-validator';

export class RemoveExcludedConceptDto {
  @IsString()
  concept!: string;
}
