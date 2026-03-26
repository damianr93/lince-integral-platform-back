import { IsOptional, IsString } from 'class-validator';

export class CreateIssueDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  body?: string;
}

export class UpdateIssueDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;
}

export class CreateIssueCommentDto {
  @IsString()
  body!: string;
}
