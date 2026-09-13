/**
 * Credit check engine — 3-tier system
 * Soft warn: ≥80% of credit limit used
 * Hard block: >100% of credit limit used
 */

export type CreditTier = 'pass' | 'soft_warn' | 'hard_block'

export interface CreditCheckInput {
  creditLimitSatang: number
  creditUsedSatang: number
  newOrderAmountSatang: number
}

export interface CreditCheckResult {
  tier: CreditTier
  creditLimitSatang: number
  creditUsedSatang: number
  newOrderAmountSatang: number
  totalAfterOrderSatang: number
  usedPct: number           // percentage after new order (0-200+)
  availableSatang: number   // remaining credit
}

export function checkCredit(input: CreditCheckInput): CreditCheckResult {
  const { creditLimitSatang, creditUsedSatang, newOrderAmountSatang } = input
  const totalAfterOrderSatang = creditUsedSatang + newOrderAmountSatang
  const availableSatang = creditLimitSatang - totalAfterOrderSatang

  let usedPct = 0
  if (creditLimitSatang > 0) {
    usedPct = Math.round((totalAfterOrderSatang / creditLimitSatang) * 100)
  }

  let tier: CreditTier
  if (creditLimitSatang === 0) {
    // No credit limit = cash customer, always pass
    tier = 'pass'
  } else if (totalAfterOrderSatang > creditLimitSatang) {
    tier = 'hard_block'
  } else if (usedPct >= 80) {
    tier = 'soft_warn'
  } else {
    tier = 'pass'
  }

  return {
    tier,
    creditLimitSatang,
    creditUsedSatang,
    newOrderAmountSatang,
    totalAfterOrderSatang,
    usedPct,
    availableSatang,
  }
}

export const CREDIT_TIER_LABELS: Record<CreditTier, string> = {
  pass: '✅ ผ่าน',
  soft_warn: '⚠️ เกือบเต็มวงเงิน',
  hard_block: '🔴 วงเงินไม่พอ',
}
