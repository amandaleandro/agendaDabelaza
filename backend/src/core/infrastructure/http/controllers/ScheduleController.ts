import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { SetScheduleUseCase } from '../../../application/schedules/SetScheduleUseCase';
import { SetScheduleDto } from '../dtos/SetScheduleDto';
import { PrismaScheduleRepository } from '../../database/repositories/PrismaScheduleRepository';

@Controller('schedules')
export class ScheduleController {
  constructor(
    private readonly setScheduleUseCase: SetScheduleUseCase,
    private readonly scheduleRepository: PrismaScheduleRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async set(@Body() dto: SetScheduleDto) {
    const schedules = await this.setScheduleUseCase.execute({
      establishmentId: dto.establishmentId,
      professionalId: dto.professionalId,
      schedules: dto.schedules,
    });

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

  @Get()
  async list(@Query('professionalId') professionalId: string) {
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
}
