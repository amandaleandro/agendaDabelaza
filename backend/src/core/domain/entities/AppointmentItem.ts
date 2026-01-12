export class AppointmentItem {
  private constructor(
    public readonly id: string,
    public readonly appointmentId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly price: number,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    id: string;
    appointmentId: string;
    productId: string;
    quantity: number;
    price: number;
  }): AppointmentItem {
    if (!props.id || !props.appointmentId || !props.productId) {
      throw new Error(
        'AppointmentItem: id, appointmentId and productId are required',
      );
    }

    if (props.quantity <= 0) {
      throw new Error('AppointmentItem: quantity must be greater than zero');
    }

    if (props.price <= 0) {
      throw new Error('AppointmentItem: price must be greater than zero');
    }

    return new AppointmentItem(
      props.id,
      props.appointmentId,
      props.productId,
      props.quantity,
      props.price,
      new Date(),
    );
  }

  static restore(props: {
    id: string;
    appointmentId: string;
    productId: string;
    quantity: number;
    price: number;
    createdAt: Date;
  }): AppointmentItem {
    return new AppointmentItem(
      props.id,
      props.appointmentId,
      props.productId,
      props.quantity,
      props.price,
      props.createdAt,
    );
  }

  getTotalPrice(): number {
    return this.quantity * this.price;
  }
}
