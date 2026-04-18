import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../core/infrastructure/database/prisma/PrismaService';
import { AuthController } from './AuthController';
import { SignupUseCase } from '../core/application/auth/SignupUseCase';
import { LoginUseCase } from '../core/application/auth/LoginUseCase';
import { GoogleIdentityService } from '../core/application/auth/GoogleIdentityService';
import { OwnerRepository } from '../core/domain/repositories/OwnerRepository';
import { EstablishmentRepository } from '../core/domain/repositories/EstablishmentRepository';
import type { SubscriptionRepository } from '../core/domain/repositories/SubscriptionRepository';
import { PrismaOwnerRepository } from '../core/infrastructure/repositories/PrismaOwnerRepository';
import { PrismaEstablishmentRepository } from '../core/infrastructure/repositories/PrismaEstablishmentRepository';
import { PrismaSubscriptionRepository } from '../core/infrastructure/database/repositories/PrismaSubscriptionRepository';
import { JwtStrategy } from '../core/infrastructure/auth/JwtStrategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [
    PrismaService,
    SignupUseCase,
    LoginUseCase,
    GoogleIdentityService,
    JwtStrategy,
    {
      provide: OwnerRepository,
      useClass: PrismaOwnerRepository,
    },
    {
      provide: EstablishmentRepository,
      useClass: PrismaEstablishmentRepository,
    },
    {
      provide: 'SubscriptionRepository',
      useClass: PrismaSubscriptionRepository,
    },
  ],
})
export class AuthModule {}
