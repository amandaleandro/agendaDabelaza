import { IsNumber, IsPositive, IsUUID, Max, Min } from 'class-validator';

export class CreateDepositPaymentDto {
  @IsUUID()
  appointmentId: string;

  @IsUUID()
  professionalId: string;

  @IsNumber()
  @IsPositive()
  totalPrice: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  depositPercent: number;
}
