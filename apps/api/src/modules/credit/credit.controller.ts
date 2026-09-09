import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CreditService } from './credit.service';
import { CreditValidationRequest, CreditValidationResult, CustomerCreditProfile } from '@wds/shared-types';

@Controller('credit')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Post('validate')
  validate(@Body() request: CreditValidationRequest): CreditValidationResult {
    return this.creditService.validateCredit(request);
  }

  @Get('profile/:customerCode')
  getProfile(@Param('customerCode') customerCode: string): CustomerCreditProfile {
    return this.creditService.getProfile(customerCode);
  }
}
