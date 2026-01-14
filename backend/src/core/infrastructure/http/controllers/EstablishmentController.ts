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
      accentColor: (establishment as any).accentColor,
      bio: establishment.bio,
      createdAt: establishment.createdAt?.toISOString(),
    }));
  }

  @Get(':id/landing-config')
  async getLandingConfig(@Param('id') id: string) {
    const establishment = await this.prisma.establishment.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        logoUrl: true,
        bannerUrl: true,
      },
    });

    if (!establishment) {
      return { error: 'Establishment not found' };
    }

    return establishment;
  }

  @Put(':id/landing-config')
  async updateLandingConfig(
    @Param('id') id: string,
    @Body() dto: UpdateEstablishmentLandingDto,
  ) {
    const data: any = {};
    
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.primaryColor !== undefined) data.primaryColor = dto.primaryColor;
    if (dto.secondaryColor !== undefined) data.secondaryColor = dto.secondaryColor;
    if (dto.accentColor !== undefined) data.accentColor = dto.accentColor;
    if (dto.logoUrl !== undefined) data.logoUrl = dto.logoUrl;
    if (dto.bannerUrl !== undefined) data.bannerUrl = dto.bannerUrl;

    const updated = await this.prisma.establishment.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        logoUrl: true,
        bannerUrl: true,
      },
    });

    return updated;
  }
}
