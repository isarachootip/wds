import { QuantityString } from './common.js';

export interface InventoryLot {
  lotId: string;
  skuCode: string;
  branchCode: string;
  locationCode: string;
  manufactureDate: string; // ISO date string YYYY-MM-DD
  expirationDate: string;  // ISO date string YYYY-MM-DD
  quantityOnHand: QuantityString;
  quantityReserved: QuantityString;
  quantityAvailable: QuantityString;
  isFullPallet: boolean;
  palletBagCount?: number;
}

export interface FefoAllocationRequest {
  skuCode: string;
  branchCode: string;
  requestedQuantity: QuantityString;
  orderId: string;
}

export interface AllocatedLotItem {
  lotId: string;
  allocatedQuantity: QuantityString;
  expirationDate: string;
  isOddLotBrokenPallet: boolean;
}

export interface FefoAllocationResult {
  skuCode: string;
  branchCode: string;
  isFullyAllocated: boolean;
  totalAllocatedQuantity: QuantityString;
  shortageQuantity: QuantityString;
  allocations: AllocatedLotItem[];
}
