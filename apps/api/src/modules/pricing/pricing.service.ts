import { Injectable, BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  PricingCalculationRequest,
  PricingCalculationResult,
  CalculatedPricingItem,
} from '@wds/shared-types';

@Injectable()
export class PricingService {
  // Baseline catalog mock for demonstration / service test
  private readonly catalog = new Map<string, { basePrice: string; costFloor: string }>([
    ['SKU-CEM-001', { basePrice: '145.0000', costFloor: '120.0000' }],
    ['SKU-CEM-002', { basePrice: '160.0000', costFloor: '135.0000' }],
    ['SKU-STL-001', { basePrice: '130.0000', costFloor: '110.0000' }],
  ]);

  // Zone freight baseline
  private readonly freightMatrix = new Map<string, string>([
    ['BKK_EAST:PICKUP_4W', '500.0000'],
    ['BKK_EAST:SIX_WHEEL_6W', '1200.0000'],
    ['BKK_EAST:TEN_WHEEL_10W', '2500.0000'],
    ['BKK_EAST:TRAILER_18W', '4000.0000'],
  ]);

  calculatePrice(request: PricingCalculationRequest): PricingCalculationResult {
    if (!request.items || request.items.length === 0) {
      throw new BadRequestException('Pricing calculation requires at least one line item');
    }

    let subtotal = new Decimal('0');
    let totalDiscount = new Decimal('0');
    let requiresApproval = false;
    let approvalReason = '';
    const calculatedItems: CalculatedPricingItem[] = [];

    for (const item of request.items) {
      const product = this.catalog.get(item.skuCode);
      const baseUnitPrice = product ? new Decimal(product.basePrice) : new Decimal('100.0000');
      const costFloorPrice = product ? new Decimal(product.costFloor) : new Decimal('80.0000');
      const qty = new Decimal(item.quantity);

      // 1. Calculate Tiered Volume Discount
      let volumeDiscountPercent = new Decimal('0');
      if (qty.greaterThanOrEqualTo(500)) {
        volumeDiscountPercent = new Decimal('8.0000');
      } else if (qty.greaterThanOrEqualTo(200)) {
        volumeDiscountPercent = new Decimal('5.0000');
      } else if (qty.greaterThanOrEqualTo(50)) {
        volumeDiscountPercent = new Decimal('3.0000');
      }

      // 2. Determine effective unit price
      let effectiveUnitPrice = baseUnitPrice.times(
        new Decimal('1').minus(volumeDiscountPercent.dividedBy(100))
      );

      // 3. Handle manual override if requested
      if (item.requestedUnitPriceOverride) {
        const overridePrice = new Decimal(item.requestedUnitPriceOverride);
        if (overridePrice.lessThan(effectiveUnitPrice)) {
          effectiveUnitPrice = overridePrice;
          requiresApproval = true;
          approvalReason = `Manual discount requested below standard volume pricing for SKU ${item.skuCode}`;
        }
      }

      // 4. Floor Price Guard Check
      const isFloorViolated = effectiveUnitPrice.lessThan(costFloorPrice);
      if (isFloorViolated) {
        requiresApproval = true;
        approvalReason = `Unit price (${effectiveUnitPrice.toFixed(4)}) is below cost floor (${costFloorPrice.toFixed(4)}) for SKU ${item.skuCode}`;
      }

      const extendedPrice = effectiveUnitPrice.times(qty);
      const itemDiscount = baseUnitPrice.times(qty).minus(extendedPrice);

      subtotal = subtotal.plus(baseUnitPrice.times(qty));
      totalDiscount = totalDiscount.plus(itemDiscount);

      calculatedItems.push({
        skuCode: item.skuCode,
        quantity: qty.toFixed(4),
        uomCode: item.uomCode,
        baseUnitPrice: baseUnitPrice.toFixed(4),
        tierDiscountPercent: '0.0000',
        volumeDiscountPercent: volumeDiscountPercent.toFixed(4),
        effectiveUnitPrice: effectiveUnitPrice.toFixed(4),
        extendedPrice: extendedPrice.toFixed(4),
        costFloorPrice: costFloorPrice.toFixed(4),
        isFloorPriceViolated: isFloorViolated,
      });
    }

    // 5. Freight Fee Calculation
    const truckKey = `${request.deliveryZoneCode}:${request.truckTypeCode || 'PICKUP_4W'}`;
    const freightFee = new Decimal(this.freightMatrix.get(truckKey) || '500.0000');

    // 6. Taxable & VAT 7% Calculation (Statutory rounding ROUND_HALF_UP)
    const netGoodsAmount = subtotal.minus(totalDiscount);
    const taxableAmount = netGoodsAmount.plus(freightFee);
    const vatRate = new Decimal('7.0000');
    const vatAmount = taxableAmount.times(vatRate).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const grandTotal = taxableAmount.plus(vatAmount);

    return {
      customerCode: request.customerCode,
      branchCode: request.branchCode,
      deliveryZoneCode: request.deliveryZoneCode,
      subtotalAmount: subtotal.toFixed(4),
      totalFreightFee: freightFee.toFixed(4),
      totalDiscountAmount: totalDiscount.toFixed(4),
      taxableAmount: taxableAmount.toFixed(4),
      vatRatePercent: vatRate.toFixed(4),
      vatAmount: vatAmount.toFixed(4),
      grandTotalAmount: grandTotal.toFixed(4),
      items: calculatedItems,
      requiresManagerApproval: requiresApproval,
      approvalReason: requiresApproval ? approvalReason : undefined,
    };
  }
}
