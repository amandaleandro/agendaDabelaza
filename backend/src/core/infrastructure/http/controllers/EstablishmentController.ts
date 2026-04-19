import { Controller, Get, Put, Param, Body, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PrismaEstablishmentRepository } from '../../repositories/PrismaEstablishmentRepository';
import { UpdateEstablishmentLandingDto } from '../dtos/UpdateEstablishmentLandingDto';
import { PrismaService } from '../../database/prisma/PrismaService';

@Controller('establishments')
export class EstablishmentController {
  constructor(
    private readonly establishmentRepository: PrismaEstablishmentRepository,
    private readonly prisma: PrismaService,
  ) {}

  private async getGalleryUrls(establishmentId: string): Promise<string[]> {
    try {
      const rows = await this.prisma.$queryRaw<Array<{ gallery_urls: string[] | null }>>`
        SELECT gallery_urls
        FROM establishments
        WHERE id = ${establishmentId}
        LIMIT 1
      `;

      return rows[0]?.gallery_urls || [];
    } catch (error) {
      if (error instanceof Error && error.message.includes('gallery_urls')) {
        return [];
      }
      throw error;
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMyEstablishment(@Req() req: any) {
    const ownerId = req.user?.ownerId;
    if (!ownerId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }
    const establishment = await this.establishmentRepository.findByOwnerId(ownerId);
    if (!establishment) {
      return { message: 'Estabelecimento não encontrado para o usuário logado.' };
    }
    return {
      id: establishment.id,
      name: establishment.name,
      slug: establishment.slug,
      ownerId: establishment.ownerId,
      primaryColor: establishment.primaryColor,
      secondaryColor: establishment.secondaryColor,
      accentColor: (establishment as any).accentColor,
      logoUrl: (establishment as any).logoUrl,
      bannerUrl: (establishment as any).bannerUrl,
      galleryUrls: (establishment as any).galleryUrls || [],
      bio: establishment.bio,
      address: (establishment as any).address,
      phone: (establishment as any).phone,
      createdAt: establishment.createdAt?.toISOString(),
    };
  }

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

    return {
      ...establishment,
      galleryUrls: await this.getGalleryUrls(id),
    };
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

    await this.prisma.establishment.update({
      where: { id },
      data,
    });

    if (dto.galleryUrls !== undefined) {
      try {
        await this.prisma.$executeRaw`
          UPDATE establishments
          SET gallery_urls = ${dto.galleryUrls}::text[]
          WHERE id = ${id}
        `;
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('gallery_urls')) {
          throw error;
        }
      }
    }

    const updated = await this.prisma.establishment.findUnique({
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

    return {
      ...updated,
      galleryUrls: await this.getGalleryUrls(id),
    };
  }
}
