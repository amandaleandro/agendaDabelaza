import { IsString, IsPositive, IsNumber, IsUUID } from 'class-validator';

export class CreateProductDto {
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
  stock: number;
}

export class AddProductToAppointmentDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;
}
