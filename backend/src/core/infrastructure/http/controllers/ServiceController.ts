import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateServiceUseCase } from '../../../application/services/CreateServiceUseCase';
import { CreateServiceDto } from '../dtos/CreateServiceDto';
import { PrismaServiceRepository } from '../../database/repositories/PrismaServiceRepository';

@Controller('services')
export class ServiceController {
  constructor(
    private readonly createServiceUseCase: CreateServiceUseCase,
    private readonly serviceRepository: PrismaServiceRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateServiceDto) {
    const service = await this.createServiceUseCase.execute({
      establishmentId: dto.establishmentId,
      professionalId: dto.professionalId,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      durationMinutes: dto.durationMinutes,
    });

    return {
      id: service.id,
      establishmentId: service.establishmentId,
      professionalId: service.professionalId,
      name: service.name,
      description: service.description,
      price: service.price,
      durationMinutes: service.durationMinutes,
      createdAt: service.createdAt.toISOString(),
    };
  }

  @Get()
  async list(@Query('professionalId') professionalId?: string) {
    const services = professionalId
      ? await this.serviceRepository.findByProfessional(professionalId)
      : await this.serviceRepository.findAll();

    return services.map((service) => ({
      id: service.id,
      establishmentId: service.establishmentId,
      professionalId: service.professionalId,
      name: service.name,
      description: service.description,
      price: service.price,
      durationMinutes: service.durationMinutes,
      createdAt: service.createdAt.toISOString(),
    }));
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const service = await this.serviceRepository.findById(id);

    if (!service) return null;

    return {
      id: service.id,
      establishmentId: service.establishmentId,
      professionalId: service.professionalId,
      name: service.name,
      description: service.description,
      price: service.price,
      durationMinutes: service.durationMinutes,
      createdAt: service.createdAt.toISOString(),
    };
  }
}
