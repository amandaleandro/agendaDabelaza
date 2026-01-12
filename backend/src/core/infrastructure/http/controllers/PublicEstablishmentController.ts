import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/PrismaService';

@Controller('public/establishments')
export class PublicEstablishmentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':slug')
  async getEstablishment(@Param('slug') slug: string) {
    const establishment = await this.prisma.establishment.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        ownerId: true,
        primaryColor: true,
        secondaryColor: true,
        logoUrl: true,
        bannerUrl: true,
        bio: true,
        depositPercent: true,
        createdAt: true,
      },
    });

    if (!establishment) throw new NotFoundException('Establishment not found');

    return establishment;
  }

  @Get(':slug/services')
  async listServices(@Param('slug') slug: string) {
    const establishment = await this.prisma.establishment.findUnique({
      where: { slug },
    });
    if (!establishment) throw new NotFoundException('Establishment not found');

    const services = await this.prisma.service.findMany({
      where: { establishmentId: establishment.id },
      orderBy: { createdAt: 'desc' },
    });

    return services.map((service) => ({
      id: service.id,
      establishmentId: service.establishmentId,
      professionalId: service.professionalId,
      name: service.name,
      description: service.description,
      price: service.price,
      durationMinutes: service.durationMinutes,
      createdAt: service.createdAt,
    }));
  }

  @Get(':slug/professionals')
  async listProfessionals(@Param('slug') slug: string) {
    const establishment = await this.prisma.establishment.findUnique({
      where: { slug },
    });
    if (!establishment) throw new NotFoundException('Establishment not found');

    const professionals = await this.prisma.professional.findMany({
      where: { establishmentId: establishment.id },
      orderBy: { createdAt: 'desc' },
    });

    return professionals.map((pro) => ({
      id: pro.id,
      establishmentId: pro.establishmentId,
      name: pro.name,
      email: pro.email,
      phone: pro.phone,
      createdAt: pro.createdAt,
    }));
  }

  @Get(':slug/schedules')
  async listSchedules(
    @Param('slug') slug: string,
    @Query('professionalId') professionalId?: string,
  ) {
    const establishment = await this.prisma.establishment.findUnique({
      where: { slug },
    });
    if (!establishment) throw new NotFoundException('Establishment not found');

    const schedules = await this.prisma.schedule.findMany({
      where: {
        establishmentId: establishment.id,
        professionalId: professionalId || undefined,
      },
      orderBy: { createdAt: 'asc' },
    });

    return schedules.map((schedule) => ({
      id: schedule.id,
      establishmentId: schedule.establishmentId,
      professionalId: schedule.professionalId,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      isAvailable: schedule.isAvailable,
      createdAt: schedule.createdAt,
    }));
  }

  @Get(':slug/subscription/:email')
  async checkSubscription(
    @Param('slug') slug: string,
    @Param('email') email: string,
  ) {
    const establishment = await this.prisma.establishment.findUnique({
      where: { slug },
    });
    if (!establishment) throw new NotFoundException('Establishment not found');

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { hasSubscription: false };
    }

    const subscription = await this.prisma.clientSubscription.findFirst({
      where: {
        userId: user.id,
        establishmentId: establishment.id,
        status: 'ACTIVE',
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!subscription) {
      return { hasSubscription: false };
    }

    const creditsRemaining = subscription.totalCredits - subscription.usedCredits;

    return {
      hasSubscription: true,
      planName: subscription.planName,
      creditsRemaining,
      totalCredits: subscription.totalCredits,
      expiresAt: subscription.expiresAt,
    };
  }
}
