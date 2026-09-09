import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'UP',
      service: 'Thai Watsadu WDS API Gateway',
      version: '1.0.0',
      timestampUtc: new Date().toISOString(),
      statutoryCompliance: {
        thaiRevenueVatRate: '7.0000%',
        numericPrecision: 'NUMERIC(18,4)',
        immutabilityGuardActive: true,
      },
    };
  }
}
