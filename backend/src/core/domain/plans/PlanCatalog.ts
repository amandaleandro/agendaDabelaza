import { Plan, PlanType } from '../entities/Plan';

export const PlanCatalog: Record<string, Plan> = {
  FREE: new Plan(PlanType.FREE, 12, 40, 10, null, false),
  BASIC: new Plan(PlanType.BASIC, 24, 30, 5, null, false),
  PRO: new Plan(PlanType.PRO, 24, 20, 0, null, false),
  PREMIUM: new Plan(PlanType.PREMIUM, 48, 0, 0, null, false),
  // Legacy support
  ENTERPRISE: new Plan(PlanType.ENTERPRISE, 48, 0, 0, null, false),
};
