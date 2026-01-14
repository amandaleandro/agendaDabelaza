import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { PrismaEstablishmentRepository } from '../../repositories/PrismaEstablishmentRepository';
import { UpdateEstablishmentLandingDto } from '../dtos/UpdateEstablishmentLandingDto';
import { PrismaService } from '../../database/prisma/PrismaService';

@Controller('establishments')
export class EstablishmentController {
  constructor(
    private readonly establishmentRepository: PrismaEstablishmentRepository,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list() {
    const establishments = await this.establishmentRepository.findAll();
    
    return establishments.map((establishment) => ({
      id: establishment.id,
      name: establishment.name,
      slug: establishment.slug,
      ownerId: establishment.ownerId,
      primaryColor: establishment.primaryColor,
      secondaryColor: establishment.secondaryColor,
      accentColor: establishment.accentColor,
      bio: establishment.bio,
      createdAt: establishment.createdAt?.toISOString(),
    }));
  }

  @Put(':id/landing-config')
  async updateLandingConfig(
    @Param('id') id: string,
    @Body() dto: UpdateEstablishmentLandingDto,
  ) {
    const updated = await this.prisma.establishment.update({
      where: { id },
      data: {
        name: dto.name,
        bio: dto.bio,
        primaryColor: dto.primaryColor,
        secondaryColor: dto.secondaryColor,
        accentColor: dto.accentColor,
        logoUrl: dto.logoUrl,
        bannerUrl: dto.bannerUrl,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      bio: updated.bio,
      primaryColor: updated.primaryColor,
      secondaryColor: updated.secondaryColor,
      accentColor: updated.accentColor,
      logoUrl: updated.logoUrl,
      bannerUrl: updated.bannerUrl,
    };
  }
}
