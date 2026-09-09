import { Controller, Post, Body } from '@nestjs/common';
import { TaxService } from './tax.service';
import { TaxInvoice } from '@wds/shared-types';

@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Post('create-invoice')
  createInvoice(@Body() body: any): TaxInvoice {
    return this.taxService.createTaxInvoice(body);
  }
}
