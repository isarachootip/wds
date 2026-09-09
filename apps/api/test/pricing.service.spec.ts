import { PricingService } from '../src/modules/pricing/pricing.service';

describe('PricingService (Epic E02 - Zero-Float Standard)', () => {
  let service: PricingService;

  beforeEach(() => {
    service = new PricingService();
  });

  it('should apply 5% volume discount for order of 250 bags (>= 200 bags tier)', () => {
    const result = service.calculatePrice({
      customerCode: 'CUST-B2B-001',
      branchCode: '00001',
      deliveryZoneCode: 'BKK_EAST',
      truckTypeCode: 'SIX_WHEEL_6W',
      items: [
        {
          skuCode: 'SKU-CEM-001',
          quantity: '250.0000',
          uomCode: 'BAG',
        },
      ],
    });

    // Base: 145.0000, 5% discount -> 137.7500
    expect(result.items[0].effectiveUnitPrice).toBe('137.7500');
    expect(result.items[0].volumeDiscountPercent).toBe('5.0000');
    expect(result.items[0].extendedPrice).toBe('34437.5000');
    expect(result.totalFreightFee).toBe('1200.0000');
    expect(result.taxableAmount).toBe('35637.5000');
    expect(result.vatAmount).toBe('2494.6300'); // 35637.50 * 0.07 = 2494.625 -> 2494.63
    expect(result.grandTotalAmount).toBe('38132.1300');
    expect(result.requiresManagerApproval).toBe(false);
  });

  it('should flag floor price violation when manual override price is below cost floor', () => {
    const result = service.calculatePrice({
      customerCode: 'CUST-B2B-001',
      branchCode: '00001',
      deliveryZoneCode: 'BKK_EAST',
      items: [
        {
          skuCode: 'SKU-CEM-001',
          quantity: '10.0000',
          uomCode: 'BAG',
          requestedUnitPriceOverride: '110.0000', // Floor is 120.0000
        },
      ],
    });

    expect(result.items[0].isFloorPriceViolated).toBe(true);
    expect(result.requiresManagerApproval).toBe(true);
    expect(result.approvalReason).toContain('below cost floor');
  });
});
