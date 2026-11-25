import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataStoreService } from '../../database/data-store';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { User, Session } from '../../database/models';

@Injectable()
export class AuthService {
  constructor(private readonly dataStore: DataStoreService) {}

  login(dto: LoginDto, userAgent?: string): { user: Partial<User>; session: Session } {
    const user = this.dataStore.findUserByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.passwordHash !== dto.password) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const session = this.dataStore.createSession(user.id, userAgent);

    return {
      user: this.sanitizeUser(user),
      session,
    };
  }

  register(dto: RegisterDto, userAgent?: string): { user: Partial<User>; session: Session } {
    const existing = this.dataStore.findUserByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email address already exists.');
    }

    const user = this.dataStore.createUser(
      dto.name,
      dto.email,
      dto.password,
      dto.currency || 'USD',
    );

    const session = this.dataStore.createSession(user.id, userAgent);

    return {
      user: this.sanitizeUser(user),
      session,
    };
  }

  logout(sessionId: string) {
    this.dataStore.deleteSession(sessionId);
    return { success: true, message: 'Logged out successfully.' };
  }

  getMe(userId: string): Partial<User> {
    const user = this.dataStore.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return this.sanitizeUser(user);
  }

  getDemoAccounts() {
    return [
      {
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@aurastudio.com',
        role: 'Studio Founder',
        region: 'US (USD $)',
        business: 'Aura Studio & Advisory LLC',
        defaultCurrency: 'USD',
        samplePassword: 'password123',
      },
      {
        id: 'user-2',
        name: 'Marcus Lindberg',
        email: 'marcus@nordicdigital.io',
        role: 'Managing Partner',
        region: 'Europe (EUR €)',
        business: 'Nordic Digital Solutions Oy',
        defaultCurrency: 'EUR',
        samplePassword: 'password123',
      },
    ];
  }

  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
