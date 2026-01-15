import { Injectable } from '@nestjs/common';
import {
  Subscription,
  SubscriptionStatus,
} from '../../../domain/entities/Subscription';
import { SubscriptionRepository } from '../../../domain/repositories/SubscriptionRepository';
import { PrismaService } from '../prisma/PrismaService';
import { PlanType } from '../../../domain/entities/Plan';

@Injectable()
export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByOwner(ownerId: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findFirst({
      where: { ownerId, status: SubscriptionStatus.ACTIVE },
      orderBy: { startedAt: 'desc' },
    });

    if (!row) return null;

    return new Subscription(
      row.id,
      row.ownerId,
      row.establishmentId,
      row.planType as PlanType,
      row.status as SubscriptionStatus,
      row.startedAt,
      row.expiresAt,
    );
  }

  async findById(id: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findUnique({ where: { id } });

    if (!row) return null;

    return new Subscription(
      row.id,
      row.ownerId,
      row.establishmentId,
      row.planType as PlanType,
      row.status as SubscriptionStatus,
      row.startedAt,
      row.expiresAt,
    );
  }

  async save(subscription: Subscription): Promise<void> {
    await this.prisma.subscription.create({
      data: {
        id: subscription.id,
        ownerId: subscription.ownerId,
        establishmentId: subscription.establishmentId,
        planType: subscription.planType,
        status: subscription.status,
        startedAt: subscription.startedAt,
        expiresAt: subscription.expiresAt,
      },
    });
  }

  async update(subscription: Subscription): Promise<void> {
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planType: subscription.planType,
        status: subscription.status,
        startedAt: subscription.startedAt,
        expiresAt: subscription.expiresAt,
      },
    });
  }

  async findAll(): Promise<Subscription[]> {
    const rows = await this.prisma.subscription.findMany({
      orderBy: { startedAt: 'desc' },
    });

    return rows.map(
      (row) =>
        new Subscription(
          row.id,
          row.ownerId,
          row.establishmentId,
          row.planType as PlanType,
          row.status as SubscriptionStatus,
          row.startedAt,
          row.expiresAt,
        ),
    );
  }

  async findByOwnerId(ownerId: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findFirst({
      where: { ownerId },
      orderBy: { startedAt: 'desc' },
    });

    if (!row) return null;

    return new Subscription(
      row.id,
      row.ownerId,
      row.establishmentId,
      row.planType as PlanType,
      row.status as SubscriptionStatus,
      row.startedAt,
      row.expiresAt,
    );
  }

  async findByEstablishmentId(establishmentId: string): Promise<Subscription | null> {
    // Buscar owner do establishment
    const establishment = await this.prisma.establishment.findUnique({
      where: { id: establishmentId },
      include: { owner: true },
    });

    if (!establishment?.owner) return null;

    // Buscar subscription do owner
    const row = await this.prisma.subscription.findFirst({
      where: { ownerId: establishment.owner.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!row) return null;

    return new Subscription(
      row.id,
      row.ownerId,
      row.establishmentId,
      row.planType as PlanType,
      row.status as SubscriptionStatus,
      row.startedAt,
      row.expiresAt,
    );
  }

  private toDomain(row: any): Subscription {
    return new Subscription(
      row.id,
      row.ownerId,
      row.establishmentId,
      row.planType as PlanType,
      row.status as SubscriptionStatus,
      row.startedAt,
      row.expiresAt,
    );
  }
}
