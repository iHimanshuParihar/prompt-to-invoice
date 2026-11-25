import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CurrencyCode } from '../../../database/models';

export class CreateClientDto {
  @ApiProperty({ example: 'Johnathan Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: 'billing@acmecorp.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+1 (555) 019-2834', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: '100 Broadway, 18th Floor', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'New York, NY', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'United States', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: 'US-9382103', required: false })
  @IsString()
  @IsOptional()
  taxNumber?: string;

  @ApiProperty({ example: 'USD', enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] })
  @IsString()
  @IsIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
  currency: CurrencyCode;

  @ApiProperty({ example: 'Priority enterprise partner', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateClientDto extends CreateClientDto {}
