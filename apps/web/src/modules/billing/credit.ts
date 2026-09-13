/**
 * Credit Engine — pure functions, no DB calls, fully testable
 * All amounts in satang (integer, ห้ามใช้ float)
 */
import { satangToBaht } from '@/lib/qt-calc'

export type CreditDecision = 'pass' | 'hold' | 'reject'

export interface CreditInput {
  /** Is account manually frozen by accounting? */
  onHold: boolean
  /** Total credit limit in satang (0 = cash customer, no credit) */
  creditLimitSatang: number
  /** Sum of open/partial/overdue invoices + active orders (excluding current order) in satang */
  outstandingSatang: number
  /** Sum of overdue invoices in satang */
  overdueAmountSatang: number
  /** The new order total in satang */
  orderTotalSatang: number
  /** Does this customer have any previously closed/delivered orders? */
  hasPriorHistory: boolean
}

export interface CreditCheckDecision {
  decision: CreditDecision
  reason: string
  availableSatang: number
  /** All inputs reflected back for audit logging */
  input: CreditInput
}

/** Amount threshold for new customers requiring approval: 50,000 baht */
export const NEW_CUSTOMER_THRESHOLD_SATANG = 5_000_000 // 50,000 บาท

export function computeAvailable(creditLimitSatang: number, outstandingSatang: number): number {
  return Math.max(0, creditLimitSatang - outstandingSatang)
}

/**
 * Run credit check — returns decision + reason
 * Priority:
 * 1. onHold=true → reject (บัญชีถูก hold)
 * 2. overdue > 0 → hold (มียอดค้างเกินกำหนด)
 * 3. orderTotal > available → hold (เกินวงเงิน)
 * 4. new customer + orderTotal > 50,000 บาท → hold (ลูกค้าใหม่ยอดสูง)
 * 5. otherwise → pass
 */
export function runCreditCheck(input: CreditInput): CreditCheckDecision {
  const availableSatang = computeAvailable(input.creditLimitSatang, input.outstandingSatang)

  // Rule 1: Account hold
  if (input.onHold) {
    return {
      decision: 'reject',
      reason: 'บัญชีลูกค้าถูก hold กรุณาติดต่อแผนกบัญชี',
      availableSatang,
      input,
    }
  }

  // Rule 2: Has overdue invoices
  if (input.overdueAmountSatang > 0) {
    return {
      decision: 'hold',
      reason: `มียอดค้างชำระเกินกำหนด ฿${satangToBaht(input.overdueAmountSatang)} — รออนุมัติแผนกบัญชี`,
      availableSatang,
      input,
    }
  }

  // Rule 3: Order exceeds available credit
  if (input.orderTotalSatang > availableSatang) {
    return {
      decision: 'hold',
      reason: `ยอด Order ฿${satangToBaht(input.orderTotalSatang)} เกินวงเงินคงเหลือ ฿${satangToBaht(availableSatang)}`,
      availableSatang,
      input,
    }
  }

  // Rule 4: New customer (no history) with high-value order
  if (!input.hasPriorHistory && input.orderTotalSatang > NEW_CUSTOMER_THRESHOLD_SATANG) {
    return {
      decision: 'hold',
      reason: `ลูกค้าใหม่ ยอด Order ฿${satangToBaht(input.orderTotalSatang)} เกิน ฿50,000 — รออนุมัติ`,
      availableSatang,
      input,
    }
  }

  // Rule 5: Pass
  return {
    decision: 'pass',
    reason: 'ผ่านการตรวจสอบเครดิตอัตโนมัติ',
    availableSatang,
    input,
  }
}

/** Check if total confirmed payments cover the order */
export function isFullyPaid(orderTotalSatang: number, confirmedPaymentsSatang: number): boolean {
  return confirmedPaymentsSatang >= orderTotalSatang
}

/** Calculate remaining balance after partial payments */
export function remainingBalanceSatang(orderTotalSatang: number, confirmedPaymentsSatang: number): number {
  return Math.max(0, orderTotalSatang - confirmedPaymentsSatang)
}
