import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
  Put,
  Param,
} from '@nestjs/common';
import { CreateClientUseCase } from '../../../application/clients/CreateClientUseCase';
import { CreateClientDto } from '../dtos/CreateClientDto';
import { PrismaClientRepository } from '../../database/repositories/PrismaClientRepository';

@Controller('clients')
export class ClientController {
  constructor(
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly clientRepository: PrismaClientRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateClientDto) {
    const client = await this.createClientUseCase.execute({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
    });

    return {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      blocked: client.blocked,
      createdAt: client.createdAt.toISOString(),
    };
  }

  @Get()
  async list() {
    const clients = await this.clientRepository.findAll();

    return clients.map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      blocked: client.blocked,
      createdAt: client.createdAt.toISOString(),
    }));
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const client = await this.clientRepository.findById(id);
    if (!client) return null;

    return {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      blocked: client.blocked,
      createdAt: client.createdAt.toISOString(),
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateClientDto>) {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const updated = await this.clientRepository.updatePartial(id, {
      name: dto.name ?? client.name,
      email: dto.email ?? client.email,
      phone: dto.phone ?? client.phone,
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      blocked: updated.blocked,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  @Patch(':id/block')
  async block(@Param('id') id: string, @Body() body: { blocked: boolean }) {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const updated = await this.clientRepository.updatePartial(id, {
      blocked: body.blocked,
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      blocked: updated.blocked,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    await this.clientRepository.delete(id);
  }
}
