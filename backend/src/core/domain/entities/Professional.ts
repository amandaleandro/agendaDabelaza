export class Professional {
  private constructor(
    public readonly id: string,
    public readonly establishmentId: string,
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly stripeAccountId: string | null,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    id: string;
    establishmentId: string;
    name: string;
    email: string;
    phone: string;
    stripeAccountId?: string;
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
      props.stripeAccountId || null,
      new Date(),
    );
  }

  static restore(props: {
    id: string;
    establishmentId: string;
    name: string;
    email: string;
    phone: string;
    stripeAccountId: string | null;
    createdAt: Date;
  }): Professional {
    return new Professional(
      props.id,
      props.establishmentId,
      props.name,
      props.email,
      props.phone,
      props.stripeAccountId,
      props.createdAt,
    );
  }
}
