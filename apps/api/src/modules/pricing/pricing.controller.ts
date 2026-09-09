import { Controller, Post, Body } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingCalculationRequest, PricingCalculationResult } from '@wds/shared-types';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('calculate')
  calculate(@Body() request: PricingCalculationRequest): PricingCalculationResult {
    return this.pricingService.calculatePrice(request);
  }
}
