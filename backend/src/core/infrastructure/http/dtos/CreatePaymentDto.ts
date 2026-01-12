import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  appointmentId: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}
