import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CurrencyCode, InvoiceStatus } from '../../../database/models';

export class CreateInvoiceItemDto {
  @ApiProperty({ example: 'Product UX Audit & Prototype', description: 'Item description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 20, description: 'Quantity or hours' })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ example: 125, description: 'Rate or unit price' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 20, description: 'Tax or VAT percentage (0 for none)' })
  @IsNumber()
  @Min(0)
  taxRate: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: 'prof-us-1', description: 'Business Profile ID' })
  @IsString()
  @IsNotEmpty()
  profileId: string;

  @ApiProperty({ example: 'cli-1', description: 'Client ID', required: false })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ example: 'Acme Corporation', description: 'Client company or person name' })
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiProperty({ example: 'billing@acmecorp.com', description: 'Client billing email' })
  @IsString()
  @IsNotEmpty()
  clientEmail: string;

  @ApiProperty({ example: '100 Broadway, New York, NY, US', required: false })
  @IsString()
  @IsOptional()
  clientAddress?: string;

  @ApiProperty({ example: 'US-9382103', required: false })
  @IsString()
  @IsOptional()
  clientTaxNumber?: string;

  @ApiProperty({ example: '2026-10-25' })
  @IsString()
  @IsNotEmpty()
  issueDate: string;

  @ApiProperty({ example: '2026-11-24' })
  @IsString()
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({ example: 'USD', enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] })
  @IsString()
  @IsIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
  currency: CurrencyCode;

  @ApiProperty({ type: [CreateInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];

  @ApiProperty({ example: 5, required: false })
  @IsNumber()
  @IsOptional()
  discountPercentage?: number;

  @ApiProperty({ example: 'Net 30. Wire or ACH transfer.', required: false })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiProperty({ example: 'Thank you for your business.', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'sent', enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'], required: false })
  @IsString()
  @IsOptional()
  @IsIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
  status?: InvoiceStatus;

  @ApiProperty({ example: '10 hours of consulting for Acme Corp at $120/hour', required: false })
  @IsString()
  @IsOptional()
  aiPromptOrigin?: string;
}

export class UpdateInvoiceDto extends CreateInvoiceDto {}

export class RecordPaymentDto {
  @ApiProperty({ example: 1200, description: 'Amount paid' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-10-25' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 'wire', enum: ['stripe', 'wire', 'cash', 'credit_card', 'paypal', 'check'] })
  @IsString()
  @IsIn(['stripe', 'wire', 'cash', 'credit_card', 'paypal', 'check'])
  method: 'stripe' | 'wire' | 'cash' | 'credit_card' | 'paypal' | 'check';

  @ApiProperty({ example: 'Wire transaction reference #49281', required: false })
  @IsString()
  @IsOptional()
  note?: string;
}
