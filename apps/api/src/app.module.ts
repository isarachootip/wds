import { Module } from '@nestjs/common';
import { PlatformModule } from './modules/platform/platform.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CreditModule } from './modules/credit/credit.module';
import { TaxModule } from './modules/tax/tax.module';
import { CustomerModule } from './modules/customer/customer.module';

@Module({
  imports: [
    PlatformModule,
    PricingModule,
    InventoryModule,
    CreditModule,
    TaxModule,
    CustomerModule,
  ],
})
export class AppModule {}
