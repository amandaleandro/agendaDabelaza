import { IsString, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateServiceDto {
  @IsUUID()
  establishmentId: string;

  @IsUUID()
  professionalId: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  durationMinutes: number;
}
