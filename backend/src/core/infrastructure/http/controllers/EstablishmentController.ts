import { Controller, Get } from '@nestjs/common';
import { PrismaEstablishmentRepository } from '../../repositories/PrismaEstablishmentRepository';

@Controller('establishments')
export class EstablishmentController {
  constructor(
    private readonly establishmentRepository: PrismaEstablishmentRepository,
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
      bio: establishment.bio,
      createdAt: establishment.createdAt?.toISOString(),
    }));
  }
}
