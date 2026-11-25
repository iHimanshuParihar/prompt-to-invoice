import { Controller, Get, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProperty, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionTier, User } from '../../database/models';
import { IsIn, IsNotEmpty } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

class UpgradeTierDto {
  @ApiProperty({ example: 'business', enum: ['starter', 'professional', 'business', 'enterprise'] })
  @IsNotEmpty()
  @IsIn(['starter', 'professional', 'business', 'enterprise'])
  tier: SubscriptionTier;
}

@ApiTags('Subscriptions & Plans')
@ApiBearerAuth()
@Controller('api/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('current')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current subscription tier and quota usage' })
  getCurrent(@CurrentUser() user: User) {
    return this.subscriptionsService.getSubscription(user.id);
  }

  @Get('tiers')
  @ApiOperation({ summary: 'List all available subscription pricing plans' })
  getTiers() {
    return this.subscriptionsService.getAvailableTiers();
  }

  @Post('change-tier')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change or upgrade subscription plan' })
  changeTier(@CurrentUser() user: User, @Body() dto: UpgradeTierDto) {
    return this.subscriptionsService.changeTier(user.id, dto.tier);
  }
}
