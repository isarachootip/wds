import { Injectable, BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  CreditValidationRequest,
  CreditValidationResult,
  CustomerCreditProfile,
} from '@wds/shared-types';

@Injectable()
export class CreditService {
  private profiles = new Map<string, CustomerCreditProfile>([
    [
      'CUST-B2B-001',
      {
        customerCode: 'CUST-B2B-001',
        customerNameTh: 'บริษัท อิตาเลียน-ไทย คอนสตรัคชั่น จำกัด (มหาชน)',
        creditTermDays: 45,
        approvedCreditLimit: '5000000.0000',
        currentArBalance: '1200000.0000',
        pendingOrderExposure: '350000.0000',
        unmaturedPdcAmount: '500000.0000',
        availableCredit: '3450000.0000', // 5,000,000 - 1,200,000 - 350,000
        overdue30DaysAmount: '0.0000',
        isCreditBlocked: false,
      },
    ],
    [
      'CUST-B2B-002',
      {
        customerCode: 'CUST-B2B-002',
        customerNameTh: 'ห้างหุ้นส่วนจำกัด บางนา โฮม บิลเดอร์',
        creditTermDays: 30,
        approvedCreditLimit: '500000.0000',
        currentArBalance: '480000.0000',
        pendingOrderExposure: '50000.0000',
        unmaturedPdcAmount: '0.0000',
        availableCredit: '0.0000',
        overdue30DaysAmount: '25000.0000',
        isCreditBlocked: true,
        creditBlockReason: 'Overdue invoices exceeding 30 days and credit limit exceeded',
      },
    ],
  ]);

  validateCredit(request: CreditValidationRequest): CreditValidationResult {
    const profile = this.profiles.get(request.customerCode);
    if (!profile) {
      throw new BadRequestException(`Customer profile not found for code: ${request.customerCode}`);
    }

    const orderAmount = new Decimal(request.orderTotalAmount);
    const creditLimit = new Decimal(profile.approvedCreditLimit);
    const arBalance = new Decimal(profile.currentArBalance);
    const pendingExposure = new Decimal(profile.pendingOrderExposure);
    const overdueAmount = new Decimal(profile.overdue30DaysAmount);

    const currentTotalExposure = arBalance.plus(pendingExposure);
    const currentAvailable = Decimal.max(new Decimal('0'), creditLimit.minus(currentTotalExposure));
    const projectedExposure = currentTotalExposure.plus(orderAmount);
    const projectedAvailable = creditLimit.minus(projectedExposure);

    const isBlockedByOverdue = overdueAmount.greaterThan(0);
    const isBlockedByLimitExceeded = projectedExposure.greaterThan(creditLimit);

    const isApproved = !isBlockedByOverdue && !isBlockedByLimitExceeded && !profile.isCreditBlocked;

    let overrideAuthority: 'NONE' | 'BRANCH_MANAGER' | 'CREDIT_DIRECTOR' = 'NONE';
    if (!isApproved) {
      if (isBlockedByOverdue || projectedExposure.minus(creditLimit).greaterThan(500000)) {
        overrideAuthority = 'CREDIT_DIRECTOR';
      } else {
        overrideAuthority = 'BRANCH_MANAGER';
      }
    }

    return {
      customerCode: request.customerCode,
      isApproved,
      isBlockedByOverdue,
      isBlockedByLimitExceeded,
      currentAvailableCredit: currentAvailable.toFixed(4),
      projectedAvailableCredit: projectedAvailable.toFixed(4),
      overrideAuthorityRequired: overrideAuthority,
    };
  }

  getProfile(customerCode: string): CustomerCreditProfile {
    const profile = this.profiles.get(customerCode);
    if (!profile) {
      throw new BadRequestException(`Customer ${customerCode} not found`);
    }
    return profile;
  }
}
