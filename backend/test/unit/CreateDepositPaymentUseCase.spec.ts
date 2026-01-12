import { Test, TestingModule } from '@nestjs/testing';
import { CreateDepositPaymentUseCase } from '../../src/core/application/payments/CreateDepositPaymentUseCase';
import {
  PaymentStatus,
  PaymentType,
} from '../../src/core/domain/entities/Payment';
import { PlanCatalog } from '../../src/core/domain/plans/PlanCatalog';
import { PlanResolverService } from '../../src/core/domain/plans/PlanResolverService';
import { InMemoryPaymentRepository } from '../../src/core/infrastructure/database/repositories/InMemoryPaymentRepository';
import { FakePaymentGateway } from '../../src/core/infrastructure/payment-gateway/FakePaymentGateway';
import { beforeEach, describe, it, expect, jest } from '@jest/globals';

describe('CreateDepositPaymentUseCase', () => {
  let useCase: CreateDepositPaymentUseCase;
  let paymentRepo: InMemoryPaymentRepository;
  let planResolver: PlanResolverService;

  beforeEach(async () => {
    paymentRepo = new InMemoryPaymentRepository();

    // Mock PlanResolverService to return FREE plan
    planResolver = {
      resolveByOwner: jest
        .fn<() => Promise<any>>()
        .mockResolvedValue(PlanCatalog.FREE),
    } as any;

    useCase = new CreateDepositPaymentUseCase(
      paymentRepo,
      new FakePaymentGateway(),
      planResolver,
    );
  });

  it('should calculate platform fee for FREE plan (10%)', async () => {
    const result = await useCase.execute({
      appointmentId: 'apt-123',
      professionalId: 'prof-123',
      totalPrice: 100,
      depositPercent: 50, // 50% of 100 = 50
    });

    // 50 * 10% = 5 platform fee
    // 50 - 5 = 45 establishment amount
    expect(result.platformFee).toBe(5);
    expect(result.establishmentAmount).toBe(45);
    expect(result.status).toBe(PaymentStatus.PAID);
  });

  it('should calculate platform fee for BASIC plan (5%)', async () => {
    (
      planResolver.resolveByOwner as jest.Mock<() => Promise<any>>
    ).mockResolvedValue(PlanCatalog.BASIC);

    const result = await useCase.execute({
      appointmentId: 'apt-456',
      professionalId: 'prof-456',
      totalPrice: 200,
      depositPercent: 30, // 30% of 200 = 60
    });

    // 60 * 5% = 3 platform fee
    // 60 - 3 = 57 establishment amount
    expect(result.platformFee).toBe(3);
    expect(result.establishmentAmount).toBe(57);
  });

  it('should store transactionId and transferId on success', async () => {
    const result = await useCase.execute({
      appointmentId: 'apt-789',
      professionalId: 'prof-789',
      totalPrice: 150,
      depositPercent: 40,
    });

    expect(result.transactionId).toBeTruthy();
    expect(result.transferId).toBeTruthy();
    expect(result.status).toBe(PaymentStatus.PAID);
  });
});
