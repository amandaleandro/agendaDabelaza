import { IsArray, IsISO8601, IsString, IsUUID, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class ServiceProfessionalPairDto {
  @IsUUID()
  serviceId: string;

  @IsUUID()
  professionalId: string;
}

export class AvailableSlotsDto {
  @IsString()
  establishmentSlug: string;

  @IsISO8601()
  date: string; // YYYY-MM-DD

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ServiceProfessionalPairDto)
  services: ServiceProfessionalPairDto[];
}
