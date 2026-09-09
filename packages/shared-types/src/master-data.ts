import { MoneyString, EntityStatus } from './common.js';

export interface Branch {
  branchCode: string; // e.g. "00001" for Bangna
  branchNameTh: string;
  branchNameEn: string;
  zoneCode: string; // e.g. "BKK_NORTH", "BKK_EAST", "UPCOUNTRY_EAST"
  isPilot: boolean;
  isActive: boolean;
  taxBranchNumber: string; // "00001"
}

export interface UnitOfMeasure {
  uomCode: string; // "BAG", "PALLET", "TON", "PIECE", "BOX"
  uomNameTh: string;
  conversionFactorToBase: MoneyString;
}

export interface ProductItem {
  skuCode: string; // 100k SKU catalog format
  barcode: string;
  nameTh: string;
  nameEn: string;
  categoryCode: string;
  baseUomCode: string;
  costFloorPrice: MoneyString;
  retailStandardPrice: MoneyString;
  isCementProduct: boolean;
  shelfLifeDays?: number;
  status: EntityStatus;
}
