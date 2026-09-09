import { Injectable, BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  FefoAllocationRequest,
  FefoAllocationResult,
  AllocatedLotItem,
  InventoryLot,
} from '@wds/shared-types';

@Injectable()
export class InventoryService {
  // Mock lot inventory for branch 00001
  private lots: InventoryLot[] = [
    {
      lotId: 'LOT-202607-001',
      skuCode: 'SKU-CEM-001',
      branchCode: '00001',
      locationCode: 'BAY-A1',
      manufactureDate: '2026-07-01',
      expirationDate: '2026-10-01',
      quantityOnHand: '35.0000', // Broken odd pallet
      quantityReserved: '0.0000',
      quantityAvailable: '35.0000',
      isFullPallet: false,
      palletBagCount: 35,
    },
    {
      lotId: 'LOT-202607-002',
      skuCode: 'SKU-CEM-001',
      branchCode: '00001',
      locationCode: 'BAY-A2',
      manufactureDate: '2026-07-05',
      expirationDate: '2026-10-05',
      quantityOnHand: '200.0000', // 4 full pallets of 50 bags
      quantityReserved: '0.0000',
      quantityAvailable: '200.0000',
      isFullPallet: true,
      palletBagCount: 50,
    },
    {
      lotId: 'LOT-202608-001',
      skuCode: 'SKU-CEM-001',
      branchCode: '00001',
      locationCode: 'BAY-A3',
      manufactureDate: '2026-08-01',
      expirationDate: '2026-11-01',
      quantityOnHand: '500.0000',
      quantityReserved: '0.0000',
      quantityAvailable: '500.0000',
      isFullPallet: true,
      palletBagCount: 50,
    },
  ];

  allocateFefo(request: FefoAllocationRequest): FefoAllocationResult {
    let remainingToAllocate = new Decimal(request.requestedQuantity);
    if (remainingToAllocate.lessThanOrEqualTo(0)) {
      throw new BadRequestException('Requested allocation quantity must be positive');
    }

    // Filter and sort lots by expiration date ascending (FEFO) and odd broken pallets first
    const availableLots = this.lots
      .filter(l => l.skuCode === request.skuCode && l.branchCode === request.branchCode)
      .sort((a, b) => {
        // Prioritize earlier expiration date
        const dateDiff = new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
        if (dateDiff !== 0) return dateDiff;
        // If same expiry date, prioritize broken lots first to avoid orphan bags
        return (a.isFullPallet ? 1 : 0) - (b.isFullPallet ? 1 : 0);
      });

    const allocations: AllocatedLotItem[] = [];
    let totalAllocated = new Decimal('0');

    for (const lot of availableLots) {
      if (remainingToAllocate.isZero()) break;

      const lotAvailable = new Decimal(lot.quantityAvailable);
      if (lotAvailable.isZero()) continue;

      const allocateFromThisLot = Decimal.min(remainingToAllocate, lotAvailable);
      allocations.push({
        lotId: lot.lotId,
        allocatedQuantity: allocateFromThisLot.toFixed(4),
        expirationDate: lot.expirationDate,
        isOddLotBrokenPallet: !lot.isFullPallet,
      });

      totalAllocated = totalAllocated.plus(allocateFromThisLot);
      remainingToAllocate = remainingToAllocate.minus(allocateFromThisLot);
    }

    const isFullyAllocated = remainingToAllocate.isZero();

    return {
      skuCode: request.skuCode,
      branchCode: request.branchCode,
      isFullyAllocated,
      totalAllocatedQuantity: totalAllocated.toFixed(4),
      shortageQuantity: remainingToAllocate.toFixed(4),
      allocations,
    };
  }
}
