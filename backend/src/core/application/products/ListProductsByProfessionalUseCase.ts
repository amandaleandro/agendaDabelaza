import { Product } from '../../domain/entities/Product';
import { ProductRepository } from '../../domain/repositories/ProductRepository';

export class ListProductsByProfessionalUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(professionalId: string): Promise<Product[]> {
    return this.productRepository.findByProfessional(professionalId);
  }
}
