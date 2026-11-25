import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ParsePromptDto {
  @ApiProperty({
    example: '10 hours of consulting for Acme Corp at $120/hour, due in 30 days, 20% VAT',
    description: 'Natural language description of the invoice to generate',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({
    example: 'prof-us-1',
    description: 'Optional business profile ID to generate under',
    required: false,
  })
  @IsString()
  @IsOptional()
  profileId?: string;
}

export class AiImprovePromptDto {
  @ApiProperty({
    example: 'Add 10% loyalty discount and change terms to net 14',
    description: 'Refinement instruction to update the current invoice draft',
  })
  @IsString()
  @IsNotEmpty()
  refinement: string;

  @ApiProperty({
    description: 'Current draft invoice object to refine',
  })
  @IsNotEmpty()
  currentDraft: any;
}
