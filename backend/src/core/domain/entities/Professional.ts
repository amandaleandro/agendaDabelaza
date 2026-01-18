export class Professional {
  private constructor(
    public readonly id: string,
    public readonly establishmentId: string,
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly createdAt: Date,
    public readonly freelancer: boolean = false,
  ) {}

  static create(props: {
    id: string;
    establishmentId: string;
    name: string;
    email: string;
    phone: string;
    freelancer?: boolean;
  }): Professional {
    if (!props.id || !props.establishmentId || !props.name || !props.email) {
      throw new Error(
        'Professional: id, establishmentId, name, and email are required',
      );
    }

    return new Professional(
      props.id,
      props.establishmentId,
      props.name,
      props.email,
      props.phone,
      new Date(),
      props.freelancer ?? false,
    );
  }

  static restore(props: {
    id: string;
    establishmentId: string;
    name: string;
    email: string;
    phone: string;
    createdAt: Date;
    freelancer?: boolean;
  }): Professional {
    return new Professional(
      props.id,
      props.establishmentId,
      props.name,
      props.email,
      props.phone,
      props.createdAt,
      props.freelancer ?? false,
    );
  }
}
