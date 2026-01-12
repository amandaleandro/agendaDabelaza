export class Owner {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly password?: string | null,
    public readonly googleId?: string | null,
    public readonly phone?: string | null,
    public readonly createdAt?: Date,
  ) {}

  static create(props: {
    id: string;
    name: string;
    email: string;
    password?: string | null;
    googleId?: string | null;
    phone?: string | null;
    createdAt?: Date;
  }): Owner {
    return new Owner(
      props.id,
      props.name,
      props.email,
      props.password,
      props.googleId,
      props.phone,
      props.createdAt || new Date(),
    );
  }
}
