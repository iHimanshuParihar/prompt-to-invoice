import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { User } from '../../database/models';

const COOKIE_NAME = 'pti_session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

@ApiTags('Authentication & Sessions')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in and receive HttpOnly session cookie' })
  login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Headers('user-agent') userAgent?: string,
  ) {
    const result = this.authService.login(dto, userAgent);
    res.cookie(COOKIE_NAME, result.session.id, COOKIE_OPTIONS);
    return {
      user: result.user,
      sessionToken: result.session.id,
      expiresAt: result.session.expiresAt,
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user account and set session cookie' })
  register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
    @Headers('user-agent') userAgent?: string,
  ) {
    const result = this.authService.register(dto, userAgent);
    res.cookie(COOKIE_NAME, result.session.id, COOKIE_OPTIONS);
    return {
      user: result.user,
      sessionToken: result.session.id,
      expiresAt: result.session.expiresAt,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out and clear session cookie' })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = (req as any).sessionId || req.cookies?.[COOKIE_NAME];
    if (sessionId) {
      this.authService.logout(sessionId);
    }
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return { success: true, message: 'Logged out successfully.' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user from session cookie' })
  getMe(@CurrentUser() user: User) {
    return this.authService.getMe(user.id);
  }

  @Get('demo-accounts')
  @ApiOperation({ summary: 'Get quick demo credentials for instant testing' })
  getDemoAccounts() {
    return this.authService.getDemoAccounts();
  }
}
