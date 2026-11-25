import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Header,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, RecordPaymentDto, UpdateInvoiceDto } from './dto/create-invoice.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../../database/models';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('api/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List all invoices with optional filtering and search' })
  @ApiQuery({ name: 'status', required: false, enum: ['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'profileId', required: false })
  findAll(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('profileId') profileId?: string,
  ) {
    return this.invoicesService.findAll(user.id, { status, search, profileId });
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get invoice by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.invoicesService.findOne(user.id, id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new invoice' })
  create(@CurrentUser() user: User, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update an existing invoice' })
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete an invoice' })
  delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.invoicesService.delete(user.id, id);
  }

  @Post(':id/send')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark invoice as sent and dispatch simulated email notification' })
  send(@CurrentUser() user: User, @Param('id') id: string) {
    return this.invoicesService.send(user.id, id);
  }

  @Post(':id/payment')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record payment toward invoice' })
  recordPayment(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: RecordPaymentDto) {
    return this.invoicesService.recordPayment(user.id, id, dto);
  }

  @Get(':id/html')
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Get printable HTML format for PDF conversion or browser print' })
  getHtml(@Param('id') id: string) {
    return this.invoicesService.generateHtml(id);
  }
}
