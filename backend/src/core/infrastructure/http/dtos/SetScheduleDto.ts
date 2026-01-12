import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { DayOfWeek } from '../../../domain/entities/Schedule';

class ScheduleIntervalDto {
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @IsString()
  startTime: string; // HH:mm format

  @IsString()
  endTime: string; // HH:mm format

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}

export class SetScheduleDto {
  @IsUUID()
  establishmentId: string;

  @IsUUID()
  professionalId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleIntervalDto)
  schedules: ScheduleIntervalDto[];
}
