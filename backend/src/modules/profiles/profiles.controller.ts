import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../../database/models';

@ApiTags('Business Profiles')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  @ApiOperation({ summary: 'List all business profiles' })
  findAll(@CurrentUser() user: User) {
    return this.profilesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business profile by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.profilesService.findOne(user.id, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new business profile' })
  create(@CurrentUser() user: User, @Body() dto: CreateProfileDto) {
    return this.profilesService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update business profile details' })
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.profilesService.update(user.id, id, dto);
  }

  @Post(':id/set-default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set business profile as default' })
  setDefault(@CurrentUser() user: User, @Param('id') id: string) {
    return this.profilesService.setDefault(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete business profile' })
  delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.profilesService.delete(user.id, id);
  }
}
