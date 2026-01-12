export class Client {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly blocked: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    id: string;
    name: string;
    email: string;
    phone: string;
  }): Client {
    if (!props.id || !props.name || !props.email) {
      throw new Error('Client: id, name, and email are required');
    }
    return new Client(
      props.id,
      props.name,
      props.email,
      props.phone,
      false,
      new Date(),
    );
  }

  static restore(props: {
    id: string;
    name: string;
    email: string;
    phone: string;
    blocked: boolean;
    createdAt: Date;
  }): Client {
    return new Client(
      props.id,
      props.name,
      props.email,
      props.phone,
      props.blocked,
      props.createdAt,
    );
  }
}
