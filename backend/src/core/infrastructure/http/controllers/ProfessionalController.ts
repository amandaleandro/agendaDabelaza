import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Put,
  Param,
} from '@nestjs/common';
import { CreateProfessionalUseCase } from '../../../application/professionals/CreateProfessionalUseCase';
import { CreateServiceUseCase } from '../../../application/services/CreateServiceUseCase';
import { CreateProfessionalDto } from '../dtos/CreateProfessionalDto';
import { CreateServiceDto } from '../dtos/CreateServiceDto';
import { PrismaProfessionalRepository } from '../../database/repositories/PrismaProfessionalRepository';
import { PrismaServiceRepository } from '../../database/repositories/PrismaServiceRepository';
import { PrismaScheduleRepository } from '../../database/repositories/PrismaScheduleRepository';
import { PrismaProductRepository } from '../../database/repositories/PrismaProductRepository';

@Controller('professionals')
export class ProfessionalController {
  constructor(
    private readonly createProfessionalUseCase: CreateProfessionalUseCase,
    private readonly createServiceUseCase: CreateServiceUseCase,
    private readonly professionalRepository: PrismaProfessionalRepository,
    private readonly serviceRepository: PrismaServiceRepository,
    private readonly scheduleRepository: PrismaScheduleRepository,
    private readonly productRepository: PrismaProductRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProfessionalDto) {
    const professional = await this.createProfessionalUseCase.execute({
      establishmentId: dto.establishmentId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
    });

    return {
      id: professional.id,
      establishmentId: professional.establishmentId,
      name: professional.name,
      email: professional.email,
      phone: professional.phone,
      createdAt: professional.createdAt.toISOString(),
    };
  }

  @Get()
  async list() {
    const professionals = await this.professionalRepository.findAll();

    return professionals.map((professional) => ({
      id: professional.id,
      establishmentId: professional.establishmentId,
      name: professional.name,
      email: professional.email,
      phone: professional.phone,
      createdAt: professional.createdAt.toISOString(),
    }));
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const professional = await this.professionalRepository.findById(id);

    if (!professional) return null;

    return {
      id: professional.id,
      establishmentId: professional.establishmentId,
      name: professional.name,
      email: professional.email,
      phone: professional.phone,
      createdAt: professional.createdAt.toISOString(),
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProfessionalDto>,
  ) {
    const professional = await this.professionalRepository.findById(id);
    if (!professional) {
      return { error: 'Professional not found' };
    }

    const updated = await this.professionalRepository.updatePartial(id, {
      name: dto.name ?? professional.name,
      email: dto.email ?? professional.email,
      phone: dto.phone ?? professional.phone,
    });

    return {
      id: professional.id,
      establishmentId: professional.establishmentId,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      createdAt: professional.createdAt.toISOString(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    const professional = await this.professionalRepository.findById(id);

    if (!professional) {
      throw new NotFoundException('Professional not found');
    }

    await this.professionalRepository.delete(id);
  }

  @Post(':id/services')
  @HttpCode(HttpStatus.CREATED)
  async createService(
    @Param('id') professionalId: string,
    @Body() dto: CreateServiceDto,
  ) {
    const service = await this.createServiceUseCase.execute({
      establishmentId: dto.establishmentId,
      professionalId,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      durationMinutes: dto.durationMinutes,
    });

    return {
      id: service.id,
      professionalId: service.professionalId,
      name: service.name,
      description: service.description,
      price: service.price,
      durationMinutes: service.durationMinutes,
      createdAt: service.createdAt.toISOString(),
    };
  }

  @Get(':id/services')
  async listServices(@Param('id') professionalId: string) {
    const services =
      await this.serviceRepository.findByProfessional(professionalId);

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

  @Get(':id/schedules')
  async listSchedules(@Param('id') professionalId: string) {
    const schedules =
      await this.scheduleRepository.findByProfessional(professionalId);

    return schedules.map((schedule) => ({
      id: schedule.id,
      establishmentId: schedule.establishmentId,
      professionalId: schedule.professionalId,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      isAvailable: schedule.isAvailable,
      createdAt: schedule.createdAt.toISOString(),
    }));
  }

  @Get(':id/products')
  async listProducts(@Param('id') professionalId: string) {
    const products =
      await this.productRepository.findByProfessional(professionalId);

    return products.map((product) => ({
      id: product.id,
      establishmentId: product.establishmentId,
      professionalId: product.professionalId,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      createdAt: product.createdAt.toISOString(),
    }));
  }
}
