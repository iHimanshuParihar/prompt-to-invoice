import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ParsePromptDto, AiImprovePromptDto } from './dto/parse-prompt.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../../database/models';

@ApiTags('AI Invoice Assistant')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('parse-prompt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Turn natural language text into a structured invoice draft',
    description: 'Generates line items, currency, taxes, terms, and totals from plain language input.',
  })
  @ApiResponse({ status: 200, description: 'Structured invoice generated successfully' })
  async parsePrompt(@CurrentUser() user: User, @Body() dto: ParsePromptDto) {
    return this.aiService.parsePrompt(user.id, dto.prompt, dto.profileId);
  }

  @Post('refine-draft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iteratively refine an existing invoice draft using conversational prompt',
  })
  async refineDraft(@Body() dto: AiImprovePromptDto) {
    return this.aiService.refineDraft(dto.refinement, dto.currentDraft);
  }
}
