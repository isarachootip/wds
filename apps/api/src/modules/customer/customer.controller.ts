import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import {
  CustomerOnboardingDto,
  CustomerFullProfile,
  CustomerDeliverySite,
  SalesExecutive,
  CreditFacilityApplication,
  CreditApprovalDto,
  SalesOrgType,
} from '@wds/shared-types';

@Controller('api/v1/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('onboard')
  onboardCustomer(@Body() dto: CustomerOnboardingDto): CustomerFullProfile {
    return this.customerService.onboardCustomer(dto);
  }

  @Get()
  getAllCustomers(): CustomerFullProfile[] {
    return this.customerService.getAllCustomers();
  }

  @Get(':code')
  getCustomer(@Param('code') code: string): CustomerFullProfile {
    return this.customerService.getCustomer(code);
  }

  @Post(':code/delivery-sites')
  addDeliverySite(
    @Param('code') code: string,
    @Body() site: Omit<CustomerDeliverySite, 'siteId' | 'customerCode' | 'zoneCode' | 'createdAt'>,
  ): CustomerDeliverySite {
    return this.customerService.addDeliverySite(code, site);
  }

  @Get('meta/sales-executives')
  getSalesExecutives(
    @Query('orgType') orgType?: SalesOrgType,
    @Query('branchCode') branchCode?: string,
  ): SalesExecutive[] {
    return this.customerService.getSalesExecutives(orgType, branchCode);
  }

  @Get('meta/credit-applications')
  getCreditApplications(): CreditFacilityApplication[] {
    return this.customerService.getCreditApplications();
  }

  @Post('credit-applications/review')
  reviewCreditApplication(@Body() dto: CreditApprovalDto): CreditFacilityApplication {
    return this.customerService.reviewCreditApplication(dto);
  }
}
