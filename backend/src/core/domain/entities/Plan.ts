export enum PlanType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

export class Plan {
  constructor(
    public readonly type: PlanType,
    public readonly cancellationWindowHours: number,
    public readonly cancellationFeePercent: number,
    public readonly platformFeePercent: number,
    public readonly maxAppointmentsPerMonth: number | null,
    public readonly requiresPrepayment: boolean,
  ) {}
}
export const FreePlan = new Plan(PlanType.FREE, 12, 40, 10, 30, false);
export const BasicPlan = new Plan(PlanType.BASIC, 24, 30, 5, null, false);
export const ProPlan = new Plan(PlanType.PRO, 24, 20, 0, null, true);
export const PremiumPlan = new Plan(PlanType.PREMIUM, 48, 0, 0, null, true);
export const EnterprisePlan = new Plan(
  PlanType.ENTERPRISE,
  48,
  0,
  0,
  null,
  true,
);
