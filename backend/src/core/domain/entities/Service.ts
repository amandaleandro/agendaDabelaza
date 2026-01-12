export class Service {
  private constructor(
    public readonly id: string,
    public readonly establishmentId: string,
    public readonly professionalId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly durationMinutes: number,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    id: string;
    establishmentId: string;
    professionalId: string;
    name: string;
    description: string;
    price: number;
    durationMinutes: number;
  }): Service {
    if (
      !props.id ||
      !props.establishmentId ||
      !props.professionalId ||
      !props.name ||
      props.price <= 0 ||
      props.durationMinutes <= 0
    ) {
      throw new Error(
        'Service: id, establishmentId, professionalId, name, positive price and durationMinutes are required',
      );
    }

    return new Service(
      props.id,
      props.establishmentId,
      props.professionalId,
      props.name,
      props.description,
      props.price,
      props.durationMinutes,
      new Date(),
    );
  }

  static restore(props: {
    id: string;
    establishmentId: string;
    professionalId: string;
    name: string;
    description: string;
    price: number;
    durationMinutes: number;
    createdAt: Date;
  }): Service {
    return new Service(
      props.id,
      props.establishmentId,
      props.professionalId,
      props.name,
      props.description,
      props.price,
      props.durationMinutes,
      props.createdAt,
    );
  }
}
