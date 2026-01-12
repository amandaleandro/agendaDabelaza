import { IsArray, IsString, IsUUID, ValidateNested, ArrayMinSize, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class ServiceProfessionalPairDto {
  @IsUUID()
  serviceId: string;

  @IsUUID()
  professionalId: string;
}

export class AvailableDatesDto {
  @IsString()
  establishmentSlug: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ServiceProfessionalPairDto)
  services: ServiceProfessionalPairDto[];

  @IsNumber()
  @Min(1)
  @Max(30)
  daysAhead?: number = 14; // Quantos dias à frente verificar (padrão 14)
}
