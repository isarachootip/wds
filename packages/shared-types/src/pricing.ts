import { MoneyString, QuantityString } from './common.js';

export interface VolumeTierRule {
  minQuantity: QuantityString;
  discountRatePercent: MoneyString; // e.g. "5.0000" for 5%
}

export interface ZoneFreightRule {
  zoneCode: string;
  truckTypeCode: string; // "PICKUP_4W", "SIX_WHEEL_6W", "TEN_WHEEL_10W", "TRAILER_18W"
  freightFeeBaht: MoneyString;
}

export interface PricingCalculationRequest {
  customerCode: string;
  branchCode: string;
  deliveryZoneCode: string;
  truckTypeCode?: string;
  items: Array<{
    skuCode: string;
    quantity: QuantityString;
    uomCode: string;
    requestedUnitPriceOverride?: MoneyString;
  }>;
}

export interface CalculatedPricingItem {
  skuCode: string;
  quantity: QuantityString;
  uomCode: string;
  baseUnitPrice: MoneyString;
  tierDiscountPercent: MoneyString;
  volumeDiscountPercent: MoneyString;
  effectiveUnitPrice: MoneyString;
  extendedPrice: MoneyString;
  costFloorPrice: MoneyString;
  isFloorPriceViolated: boolean;
}

export interface PricingCalculationResult {
  customerCode: string;
  branchCode: string;
  deliveryZoneCode: string;
  subtotalAmount: MoneyString;
  totalFreightFee: MoneyString;
  totalDiscountAmount: MoneyString;
  taxableAmount: MoneyString;
  vatRatePercent: MoneyString; // e.g. "7.0000"
  vatAmount: MoneyString;
  grandTotalAmount: MoneyString;
  items: CalculatedPricingItem[];
  requiresManagerApproval: boolean;
  approvalReason?: string;
}
