import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('System Health')
@Controller('api')
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'Backend system health check' })
  healthCheck() {
    return {
      status: 'ok',
      service: 'PromptToInvoice API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || 'production',
      features: {
        aiInvoiceParser: true,
        multiCurrency: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
        databasePersisted: true,
      },
    };
  }
}
