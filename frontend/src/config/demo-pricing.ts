/**
 * DEMO / ILLUSTRATIVE pricing for the public landing page only.
 *
 * - Not real service charges and not returned by any backend API.
 * - Intentionally isolated: nothing here is read by portal code, payments or the API layer.
 * - Amounts are monthly, in Bangladeshi Taka (BDT, ৳). Labels live in the i18n dictionaries.
 */
export const DEMO_PRICING_LABEL = "Demo Pricing" as const;

export interface DemoPlan {
  id: "starter" | "standard" | "pro" | "enterprise";
  /** Monthly demo price in BDT; null means "Let's Talk". */
  monthlyBdt: number | null;
  featured?: boolean;
}

export const demoPlans: readonly DemoPlan[] = [
  { id: "starter", monthlyBdt: 4999 },
  { id: "standard", monthlyBdt: 14999, featured: true },
  { id: "pro", monthlyBdt: 34999 },
  { id: "enterprise", monthlyBdt: null },
] as const;
