import { Product } from '../../domain/entities/Product';
import { ProductRepository } from '../../domain/repositories/ProductRepository';

type CreateProductInput = {
  id: string;
  establishmentId: string;
  professionalId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
};

export class CreateProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const product = Product.create({
      id: input.id,
      establishmentId: input.establishmentId,
      professionalId: input.professionalId,
      name: input.name,
      description: input.description,
      price: input.price,
      stock: input.stock,
    });

    await this.productRepository.save(product);

    return product;
  }
}
