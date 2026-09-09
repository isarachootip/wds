import { MoneyString } from './common.js';

export interface CustomerCreditProfile {
  customerCode: string;
  customerNameTh: string;
  creditTermDays: number; // e.g. 30, 45, 60
  approvedCreditLimit: MoneyString;
  currentArBalance: MoneyString;
  pendingOrderExposure: MoneyString;
  unmaturedPdcAmount: MoneyString;
  availableCredit: MoneyString;
  overdue30DaysAmount: MoneyString;
  isCreditBlocked: boolean;
  creditBlockReason?: string;
}

export interface CreditValidationRequest {
  customerCode: string;
  orderTotalAmount: MoneyString;
}

export interface CreditValidationResult {
  customerCode: string;
  isApproved: boolean;
  isBlockedByOverdue: boolean;
  isBlockedByLimitExceeded: boolean;
  currentAvailableCredit: MoneyString;
  projectedAvailableCredit: MoneyString;
  overrideAuthorityRequired?: 'NONE' | 'BRANCH_MANAGER' | 'CREDIT_DIRECTOR';
}
