import { AppointmentItem } from '../../domain/entities/AppointmentItem';
import { AppointmentItemRepository } from '../../domain/repositories/AppointmentItemRepository';
import { ProductRepository } from '../../domain/repositories/ProductRepository';

type AddProductToAppointmentInput = {
  id: string;
  appointmentId: string;
  productId: string;
  quantity: number;
};

export class AddProductToAppointmentUseCase {
  constructor(
    private readonly appointmentItemRepository: AppointmentItemRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(input: AddProductToAppointmentInput): Promise<AppointmentItem> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stock < input.quantity) {
      throw new Error('Insufficient product stock');
    }

    const item = AppointmentItem.create({
      id: input.id,
      appointmentId: input.appointmentId,
      productId: input.productId,
      quantity: input.quantity,
      price: product.price,
    });

    // Decrease product stock
    product.decreaseStock(input.quantity);
    await this.productRepository.update(product);

    await this.appointmentItemRepository.save(item);

    return item;
  }
}
