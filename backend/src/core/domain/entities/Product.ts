export class Product {
  private constructor(
    public readonly id: string,
    public readonly establishmentId: string,
    public readonly professionalId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly stock: number,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    id: string;
    establishmentId: string;
    professionalId: string;
    name: string;
    description: string;
    price: number;
    stock: number;
  }): Product {
    if (
      !props.id ||
      !props.establishmentId ||
      !props.professionalId ||
      !props.name
    ) {
      throw new Error(
        'Product: id, establishmentId, professionalId and name are required',
      );
    }

    if (props.price <= 0) {
      throw new Error('Product: price must be greater than zero');
    }

    if (props.stock < 0) {
      throw new Error('Product: stock cannot be negative');
    }

    return new Product(
      props.id,
      props.establishmentId,
      props.professionalId,
      props.name,
      props.description,
      props.price,
      props.stock,
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
    stock: number;
    createdAt: Date;
  }): Product {
    return new Product(
      props.id,
      props.establishmentId,
      props.professionalId,
      props.name,
      props.description,
      props.price,
      props.stock,
      props.createdAt,
    );
  }

  decreaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Product: quantity must be greater than zero');
    }

    if (this.stock < quantity) {
      throw new Error('Product: insufficient stock');
    }

    (this as any).stock -= quantity;
  }

  increaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Product: quantity must be greater than zero');
    }

    (this as any).stock += quantity;
  }
}
