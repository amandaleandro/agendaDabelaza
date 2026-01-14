import { IsEnum, IsUUID } from 'class-validator';
import { PlanType } from '../../../domain/entities/Plan';

export class CreateSubscriptionDto {
  @IsUUID()
  ownerId: string;

  @IsUUID()
  establishmentId: string;

  @IsEnum(PlanType)
  planType: PlanType;
}
