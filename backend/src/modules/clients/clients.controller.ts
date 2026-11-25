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
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../../database/models';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'List all clients with billing statistics' })
  findAll(@CurrentUser() user: User) {
    return this.clientsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client details' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.clientsService.findOne(user.id, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new client record' })
  create(@CurrentUser() user: User, @Body() dto: CreateClientDto) {
    return this.clientsService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client details' })
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client' })
  delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.clientsService.delete(user.id, id);
  }
}
