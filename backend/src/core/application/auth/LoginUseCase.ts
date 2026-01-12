import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { OwnerRepository } from '../../domain/repositories/OwnerRepository';
import { EstablishmentRepository } from '../../domain/repositories/EstablishmentRepository';

interface LoginInput {
  email: string;
  password?: string;
  googleId?: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly ownerRepository: OwnerRepository,
    private readonly establishmentRepository: EstablishmentRepository,
  ) {}

  async execute(input: LoginInput) {
    const owner = await this.ownerRepository.findByEmail(input.email);

    if (!owner) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (input.password) {
      if (!owner.password) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const isPasswordValid = await compare(input.password, owner.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else if (input.googleId) {
      if (owner.googleId !== input.googleId) {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else {
      throw new UnauthorizedException('Invalid credentials');
    }

    const establishment = await this.establishmentRepository.findByOwnerId(
      owner.id,
    );

    if (!establishment) {
      // Should not happen if signup is atomic, but good to handle
      throw new UnauthorizedException('Establishment not found for this user');
    }

    return {
      owner,
      establishment,
    };
  }
}
