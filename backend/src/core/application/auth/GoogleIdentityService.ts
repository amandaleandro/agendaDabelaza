import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

interface GoogleProfile {
  email: string;
  googleId: string;
  name: string;
}

@Injectable()
export class GoogleIdentityService {
  private readonly client = new OAuth2Client();

  async verify(idToken?: string): Promise<GoogleProfile> {
    if (!idToken) {
      throw new BadRequestException('Google token is required');
    }

    const audiences = this.getAudiences();
    if (!audiences.length) {
      throw new InternalServerErrorException('Google login is not configured');
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: audiences,
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email || !payload.email_verified) {
        throw new UnauthorizedException('Google account could not be verified');
      }

      return {
        email: payload.email,
        googleId: payload.sub,
        name: payload.name?.trim() || payload.email.split('@')[0],
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new UnauthorizedException('Invalid Google token');
    }
  }

  private getAudiences(): string[] {
    return [
      process.env.GOOGLE_CLIENT_ID,
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    ]
      .flatMap((value) => (value ?? '').split(','))
      .map((value) => value.trim())
      .filter(Boolean);
  }
}
