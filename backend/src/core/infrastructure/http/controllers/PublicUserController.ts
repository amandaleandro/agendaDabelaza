import {
  Body,
  Controller,
  Get,
  Put,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/PrismaService';
import * as bcrypt from 'bcryptjs';

@Controller('public/users')
export class PublicUserController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { name?: string; phone?: string; currentPassword?: string; newPassword?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};

    // Atualizar nome se fornecido
    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    // Atualizar telefone se fornecido
    if (body.phone !== undefined) {
      updateData.phone = body.phone;
    }

    // Atualizar senha se fornecida
    if (body.newPassword) {
      // Validar senha atual
      if (!body.currentPassword) {
        throw new BadRequestException('Current password is required to change password');
      }

      if (!user.password) {
        throw new BadRequestException('User has no password set');
      }

      const isPasswordValid = await bcrypt.compare(body.currentPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      if (body.newPassword.length < 6) {
        throw new BadRequestException('New password must be at least 6 characters');
      }

      updateData.password = await bcrypt.hash(body.newPassword, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    return updatedUser;
  }
}
