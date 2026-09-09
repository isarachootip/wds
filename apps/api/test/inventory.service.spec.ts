import { InventoryService } from '../src/modules/inventory/inventory.service';

describe('InventoryService (Epic E07 - FEFO Cement Lot Allocation V2)', () => {
  let service: InventoryService;

  beforeEach(() => {
    service = new InventoryService();
  });

  it('should exhaust odd broken pallets first before allocating full pallets', () => {
    const result = service.allocateFefo({
      skuCode: 'SKU-CEM-001',
      branchCode: '00001',
      requestedQuantity: '120.0000',
      orderId: 'ORD-TEST-001',
    });

    expect(result.isFullyAllocated).toBe(true);
    expect(result.totalAllocatedQuantity).toBe('120.0000');
    expect(result.allocations.length).toBe(2);

    // Allocation 1: Odd broken pallet (35 bags, expiring 2026-10-01)
    expect(result.allocations[0].lotId).toBe('LOT-202607-001');
    expect(result.allocations[0].allocatedQuantity).toBe('35.0000');
    expect(result.allocations[0].isOddLotBrokenPallet).toBe(true);

    // Allocation 2: Full pallet lot (85 bags remaining, expiring 2026-10-05)
    expect(result.allocations[1].lotId).toBe('LOT-202607-002');
    expect(result.allocations[1].allocatedQuantity).toBe('85.0000');
    expect(result.allocations[1].isOddLotBrokenPallet).toBe(false);
  });
});
