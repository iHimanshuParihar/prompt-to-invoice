import { IsString, IsNotEmpty, IsOptional, IsIn, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CurrencyCode } from '../../../database/models';

export class CreateProfileDto {
  @ApiProperty({ example: 'Apex Digital Advisory LLC' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Apex Digital Advisory LLC', required: false })
  @IsString()
  @IsOptional()
  legalName?: string;

  @ApiProperty({ example: 'billing@apexdigital.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+1 (415) 890-3321', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'https://apexdigital.com', required: false })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({ example: '500 Howard Street, Suite 400' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'San Francisco, CA' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'United States' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: '94105' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ example: 'EIN: 84-2918274', required: false })
  @IsString()
  @IsOptional()
  taxNumber?: string;

  @ApiProperty({ example: 'USD', enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] })
  @IsString()
  @IsIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
  currency: CurrencyCode;

  @ApiProperty({ example: 30, description: 'Default net terms in days' })
  @IsNumber()
  defaultPaymentTermsDays: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  bankDetails?: {
    bankName: string;
    accountNumber?: string;
    routingNumber?: string;
    iban?: string;
    bic?: string;
  };
}

export class UpdateProfileDto extends CreateProfileDto {}
