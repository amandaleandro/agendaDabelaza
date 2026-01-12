import { Type } from 'class-transformer';
import {
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  establishmentId: string;

  @IsUUID()
  professionalId: string;

  @IsString()
  serviceId: string;

  @IsISO8601()
  scheduledAt: string; // ISO 8601 date string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  depositPercent?: number;
}
