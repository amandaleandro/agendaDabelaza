import {
  IsEmail,
  IsString,
  IsPhoneNumber,
  IsUUID,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateProfessionalDto {
  @IsUUID()
  establishmentId: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsBoolean()
  freelancer?: boolean;
}
