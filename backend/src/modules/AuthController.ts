import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { SignupUseCase } from '../core/application/auth/SignupUseCase';
import { LoginUseCase } from '../core/application/auth/LoginUseCase';
import { Response } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly signupUseCase: SignupUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  private generateToken(ownerId: string, email: string): string {
    return jwt.sign(
      { ownerId, email, type: 'owner' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  @Post('login')
  async login(@Body() body: any, @Res() res: Response) {
    try {
      const result = await this.loginUseCase.execute({
        email: body.email,
        password: body.password,
        googleId: body.googleId,
      });

      const token = this.generateToken(result.owner.id, result.owner.email);

      return res.status(HttpStatus.OK).json({
        token,
        owner: {
          id: result.owner.id,
          name: result.owner.name,
          email: result.owner.email,
        },
        establishment: {
          id: result.establishment.id,
          name: result.establishment.name,
          slug: result.establishment.slug,
        },
      });
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          message: error.message,
        });
      }
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: error.message || 'Error logging in',
      });
    }
  }

  @Post('signup')
  async signup(@Body() body: any, @Res() res: Response) {
    try {
      const result = await this.signupUseCase.execute({
        ownerName: body.name || body.ownerName,
        email: body.email,
        password: body.password,
        phone: body.phone,
        companyName: body.establishmentName || body.companyName,
        slug: body.establishmentSlug || body.slug,
        bio: body.bio,
        primaryColor: body.primaryColor,
        googleId: body.googleId,
        cnpj: body.cnpj,
        address: body.address,
        planType: body.planType, // Add plan selection
      });

      const token = this.generateToken(result.owner.id, result.owner.email);

      return res.status(HttpStatus.CREATED).json({
        token,
        owner: {
          id: result.owner.id,
          name: result.owner.name,
          email: result.owner.email,
        },
        establishment: {
          id: result.establishment.id,
          name: result.establishment.name,
          slug: result.establishment.slug,
        },
      });
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: error.message || 'Error creating account',
      });
    }
  }
}
