import { CreditService } from '../src/modules/credit/credit.service';

describe('CreditService (Epic E03 - Credit & PDC Exposure Desk)', () => {
  let service: CreditService;

  beforeEach(() => {
    service = new CreditService();
  });

  it('should approve credit check when order is within approved available credit', () => {
    const result = service.validateCredit({
      customerCode: 'CUST-B2B-001',
      orderTotalAmount: '350000.0000',
    });

    expect(result.isApproved).toBe(true);
    expect(result.isBlockedByOverdue).toBe(false);
    expect(result.isBlockedByLimitExceeded).toBe(false);
    expect(result.currentAvailableCredit).toBe('3450000.0000');
    expect(result.projectedAvailableCredit).toBe('3100000.0000');
  });

  it('should hard-stop credit for delinquent customer with overdue invoices', () => {
    const result = service.validateCredit({
      customerCode: 'CUST-B2B-002',
      orderTotalAmount: '10000.0000',
    });

    expect(result.isApproved).toBe(false);
    expect(result.isBlockedByOverdue).toBe(true);
    expect(result.overrideAuthorityRequired).toBe('CREDIT_DIRECTOR');
  });
});
