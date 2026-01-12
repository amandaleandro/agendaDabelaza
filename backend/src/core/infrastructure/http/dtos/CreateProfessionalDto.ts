import {
  IsEmail,
  IsString,
  IsPhoneNumber,
  IsUUID,
  IsOptional,
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
  @IsString()
  stripeAccountId?: string;
}
