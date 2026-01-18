import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Post,
  Put,
  Param,
} from '@nestjs/common';
import { CreateProfessionalUseCase } from '../../../application/professionals/CreateProfessionalUseCase';
import { DeleteProfessionalUseCase } from '../../../application/professionals/DeleteProfessionalUseCase';
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
    private readonly deleteProfessionalUseCase: DeleteProfessionalUseCase,
    private readonly createServiceUseCase: CreateServiceUseCase,
    private readonly professionalRepository: PrismaProfessionalRepository,
    private readonly serviceRepository: PrismaServiceRepository,
    private readonly scheduleRepository: PrismaScheduleRepository,
    private readonly productRepository: PrismaProductRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProfessionalDto) {
    try {
      const professional = await this.createProfessionalUseCase.execute({
        establishmentId: dto.establishmentId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        freelancer: dto.freelancer,
      });

      return {
        id: professional.id,
        establishmentId: professional.establishmentId,
        name: professional.name,
        email: professional.email,
        phone: professional.phone,
        freelancer: professional.freelancer,
        createdAt: professional.createdAt.toISOString(),
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Professional already linked to another establishment'
      ) {
        throw new ConflictException(error.message);
      }

      if (
        error instanceof Error &&
        error.message === 'Professional already exists in this establishment'
      ) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
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
      freelancer: professional.freelancer,
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
      freelancer: professional.freelancer,
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

    if (dto.email) {
      const existingByEmail = await this.professionalRepository.findByEmail(
        dto.email,
      );

      const existsInOtherEstablishment = existingByEmail.find(
        (existing) =>
          existing.establishmentId !== professional.establishmentId &&
          existing.id !== professional.id &&
          !dto.freelancer,
      );

      if (existsInOtherEstablishment) {
        throw new ConflictException(
          'Professional already linked to another establishment',
        );
      }

      const existsInSameEstablishment = existingByEmail.find(
        (existing) =>
          existing.establishmentId === professional.establishmentId &&
          existing.id !== professional.id,
      );

      if (existsInSameEstablishment) {
        throw new ConflictException(
          'Professional already exists in this establishment',
        );
      }
    }

    const updated = await this.professionalRepository.updatePartial(id, {
      name: dto.name ?? professional.name,
      email: dto.email ?? professional.email,
      phone: dto.phone ?? professional.phone,
      freelancer: dto.freelancer ?? professional.freelancer,
    });

    return {
      id: professional.id,
      establishmentId: professional.establishmentId,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      freelancer: updated.freelancer,
      createdAt: professional.createdAt.toISOString(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    try {
      await this.deleteProfessionalUseCase.execute({
        professionalId: id,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          'Cannot delete professional with active schedules. Delete schedules first.'
      ) {
        throw new BadRequestException(error.message);
      }

      if (error instanceof Error && error.message === 'Professional not found') {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
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
