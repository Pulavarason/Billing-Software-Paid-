export type PlanId = "monthly" | "quarterly" | "yearly";

export interface Plan {
  id: PlanId;
  label: string;
  amountInr: number; // rupees, not paise
  durationMonths: number;
  priceSuffix: string;
  bestValue?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  monthly: {
    id: "monthly",
    label: "Monthly",
    amountInr: 399,
    durationMonths: 1,
    priceSuffix: "/ month"
  },
  quarterly: {
    id: "quarterly",
    label: "Quarterly",
    amountInr: 999,
    durationMonths: 3,
    priceSuffix: "/ 3 months"
  },
  yearly: {
    id: "yearly",
    label: "Yearly",
    amountInr: 4000,
    durationMonths: 12,
    priceSuffix: "/ year",
    bestValue: true
  }
};

export function isPlanId(value: string): value is PlanId {
  return value === "monthly" || value === "quarterly" || value === "yearly";
}

export function addMonthsIso(fromIso: string, months: number): string {
  const d = new Date(fromIso);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString();
}
