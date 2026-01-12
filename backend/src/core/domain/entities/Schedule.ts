export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export class Schedule {
  private constructor(
    public readonly id: string,
    public readonly establishmentId: string,
    public readonly professionalId: string,
    public readonly dayOfWeek: DayOfWeek,
    public readonly startTime: string, // HH:mm format
    public readonly endTime: string, // HH:mm format
    public readonly isAvailable: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    id: string;
    establishmentId: string;
    professionalId: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    isAvailable?: boolean;
  }): Schedule {
    if (
      !props.id ||
      !props.establishmentId ||
      !props.professionalId ||
      !props.dayOfWeek ||
      !props.startTime ||
      !props.endTime
    ) {
      throw new Error('Schedule: all fields are required');
    }

    if (
      !this.isValidTimeFormat(props.startTime) ||
      !this.isValidTimeFormat(props.endTime)
    ) {
      throw new Error('Schedule: times must be in HH:mm format');
    }

    return new Schedule(
      props.id,
      props.establishmentId,
      props.professionalId,
      props.dayOfWeek,
      props.startTime,
      props.endTime,
      props.isAvailable ?? true,
      new Date(),
    );
  }

  static restore(props: {
    id: string;
    establishmentId: string;
    professionalId: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    createdAt: Date;
  }): Schedule {
    return new Schedule(
      props.id,
      props.establishmentId,
      props.professionalId,
      props.dayOfWeek,
      props.startTime,
      props.endTime,
      props.isAvailable,
      props.createdAt,
    );
  }

  private static isValidTimeFormat(time: string): boolean {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  }

  toggleAvailability(): void {
    (this as any).isAvailable = !this.isAvailable;
  }
}
