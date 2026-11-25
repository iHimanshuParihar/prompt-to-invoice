import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../../database/models';

@ApiTags('Analytics & Business Insights')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get aggregated dashboard metrics, revenue trends, status breakdown, and AI insights' })
  @ApiQuery({ name: 'currency', required: false, enum: ['all', 'USD', 'EUR', 'GBP'] })
  getDashboardMetrics(@CurrentUser() user: User, @Query('currency') currency?: string) {
    return this.analyticsService.getDashboardMetrics(user.id, currency);
  }
}
