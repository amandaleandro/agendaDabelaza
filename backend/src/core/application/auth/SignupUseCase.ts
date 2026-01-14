import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Owner } from '../../domain/entities/Owner';
import { Establishment } from '../../domain/entities/Establishment';
import { Subscription, SubscriptionStatus } from '../../domain/entities/Subscription';
import { OwnerRepository } from '../../domain/repositories/OwnerRepository';
import { EstablishmentRepository } from '../../domain/repositories/EstablishmentRepository';
import type { SubscriptionRepository } from '../../domain/repositories/SubscriptionRepository';
import { PlanType } from '../../domain/entities/Plan';

interface SignupInput {
  ownerName: string;
  email: string;
  password?: string;
  phone?: string;
  companyName: string;
  slug: string;
  bio?: string;
  primaryColor?: string;
  googleId?: string;
  cnpj?: string;
  address?: string;
}

@Injectable()
export class SignupUseCase {
  constructor(
    private readonly ownerRepository: OwnerRepository,
    private readonly establishmentRepository: EstablishmentRepository,
    @Inject('SubscriptionRepository')
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(input: SignupInput) {
    // 1. Check if owner exists
    const existingOwner = await this.ownerRepository.findByEmail(input.email);
    if (existingOwner) {
      throw new ConflictException('Email already in use');
    }

    // 2. Check if slug exists
    const existingSlug = await this.establishmentRepository.findBySlug(
      input.slug,
    );
    if (existingSlug) {
      throw new ConflictException('Slug already in use');
    }

    // 3. Hash password (if provided)
    let hashedPassword: string | null = null;
    if (input.password) {
      hashedPassword = await hash(input.password, 8);
    }

    // 4. Create Owner
    const ownerId = randomUUID();
    const owner = Owner.create({
      id: ownerId,
      name: input.ownerName,
      email: input.email,
      password: hashedPassword,
      phone: input.phone,
      googleId: input.googleId,
    });

    await this.ownerRepository.save(owner);

    // 5. Create Establishment
    const establishment = Establishment.create({
      id: randomUUID(),
      name: input.companyName,
      slug: input.slug,
      ownerId: ownerId,
      bio: input.bio,
      primaryColor: input.primaryColor,
      cnpj: input.cnpj,
      address: input.address,
    });

    await this.establishmentRepository.save(establishment);

    // 6. Create default subscription (FREE plan)
    const subscription = new Subscription(
      randomUUID(),
      ownerId,
      establishment.id,
      PlanType.FREE,
      SubscriptionStatus.ACTIVE,
      new Date(),
      null, // Free plan: no expiration
    );

    await this.subscriptionRepository.save(subscription);

    return {
      owner,
      establishment,
      subscription,
    };
  }
}
