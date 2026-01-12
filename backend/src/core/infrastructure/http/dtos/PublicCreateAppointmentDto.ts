import {
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
  IsNumber,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ServiceProfessionalDto {
  @IsUUID()
  serviceId: string;

  @IsOptional()
  @IsUUID()
  professionalId?: string;
}

export class PublicCreateAppointmentDto {
  @IsString()
  establishmentSlug: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  password: string;

  @IsString()
  phone: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ServiceProfessionalDto)
  services: ServiceProfessionalDto[];

  // Expect date string YYYY-MM-DD
  @IsString()
  date: string;

  // Expect HH:mm
  @IsString()
  slot: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  depositPercent?: number;
}
