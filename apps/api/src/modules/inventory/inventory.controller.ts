import { Controller, Post, Body } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { FefoAllocationRequest, FefoAllocationResult } from '@wds/shared-types';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('allocate-fefo')
  allocateFefo(@Body() request: FefoAllocationRequest): FefoAllocationResult {
    return this.inventoryService.allocateFefo(request);
  }
}
