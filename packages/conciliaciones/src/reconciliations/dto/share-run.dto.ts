import { IsEmail, IsEnum } from 'class-validator';
import { RunMemberRole } from '../../enums';

export class ShareRunDto {
  @IsEmail()
  email!: string;

  @IsEnum(RunMemberRole)
  role!: RunMemberRole;
}
