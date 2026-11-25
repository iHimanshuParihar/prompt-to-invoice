import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataStoreService } from '../../database/data-store';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly dataStore: DataStoreService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // 1. Try reading HTTP-Only cookie 'pti_session'
    let sessionId = request.cookies?.pti_session;

    // 2. Fallback to Bearer token header
    if (!sessionId && request.headers.authorization) {
      const parts = request.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        sessionId = parts[1];
      }
    }

    if (!sessionId) {
      throw new UnauthorizedException('Authentication required. Please sign in.');
    }

    const session = this.dataStore.findSession(sessionId);
    if (!session) {
      throw new UnauthorizedException('Session expired or invalid. Please sign in again.');
    }

    const user = this.dataStore.findUserById(session.userId);
    if (!user) {
      throw new UnauthorizedException('User account no longer exists.');
    }

    request.user = user;
    request.sessionId = session.id;
    return true;
  }
}
