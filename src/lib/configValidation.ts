export const BILLING_CYCLES = ['monthly', 'quarterly', 'yearly', 'one_time'] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export interface PlanConfigPatch {
  price_ghs?: number;
  billing_cycle?: string;
  active_listing_cap?: number;
  archive_after_days?: number;
  features?: string[];
  is_active?: boolean;
}

export interface CreditConfigPatch {
  credit_price_ghs?: number;
  credit_min_qty?: number;
  credit_max_qty?: number;
  boost_duration_days?: number;
}

export function validatePlanPatch(patch: PlanConfigPatch): string | null {
  if (patch.price_ghs !== undefined) {
    if (typeof patch.price_ghs !== 'number' || Number.isNaN(patch.price_ghs) || patch.price_ghs < 0) {
      return 'Plan price must be a number ≥ 0';
    }
  }
  if (patch.billing_cycle !== undefined) {
    if (!(BILLING_CYCLES as readonly string[]).includes(patch.billing_cycle)) {
      return 'Billing cycle must be monthly, quarterly, yearly, or one_time';
    }
  }
  if (patch.active_listing_cap !== undefined) {
    if (!Number.isInteger(patch.active_listing_cap) || patch.active_listing_cap < 1) {
      return 'Active listing cap must be an integer ≥ 1';
    }
  }
  if (patch.archive_after_days !== undefined) {
    if (!Number.isInteger(patch.archive_after_days) || patch.archive_after_days < 1) {
      return 'Archive window must be an integer ≥ 1 day';
    }
  }
  if (patch.features !== undefined) {
    if (!Array.isArray(patch.features) || patch.features.some((f) => typeof f !== 'string')) {
      return 'Features must be an array of strings';
    }
  }
  if (patch.is_active !== undefined && typeof patch.is_active !== 'boolean') {
    return 'is_active must be a boolean';
  }
  return null;
}

export function validateCreditPatch(patch: CreditConfigPatch): string | null {
  if (patch.credit_price_ghs !== undefined) {
    if (
      typeof patch.credit_price_ghs !== 'number' ||
      Number.isNaN(patch.credit_price_ghs) ||
      patch.credit_price_ghs <= 0
    ) {
      return 'Credit price must be a number > 0';
    }
  }
  if (patch.credit_min_qty !== undefined) {
    if (!Number.isInteger(patch.credit_min_qty) || patch.credit_min_qty < 1) {
      return 'Minimum quantity must be an integer ≥ 1';
    }
  }
  const min = patch.credit_min_qty;
  const max = patch.credit_max_qty;
  if (max !== undefined) {
    if (!Number.isInteger(max) || max < 1) {
      return 'Maximum quantity must be an integer ≥ 1';
    }
    if (min !== undefined && max < min) {
      return 'Maximum quantity must be ≥ minimum quantity';
    }
  }
  if (patch.boost_duration_days !== undefined) {
    if (!Number.isInteger(patch.boost_duration_days) || patch.boost_duration_days < 1) {
      return 'Boost duration must be an integer ≥ 1 day';
    }
  }
  return null;
}
