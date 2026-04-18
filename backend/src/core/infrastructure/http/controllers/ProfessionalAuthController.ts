import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaProfessionalRepository } from '../../database/repositories/PrismaProfessionalRepository';
import { PrismaService } from '../../database/prisma/PrismaService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

@Controller('professional-auth')
export class ProfessionalAuthController {
  constructor(
    private readonly professionalRepository: PrismaProfessionalRepository,
    private readonly prisma: PrismaService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email?: string; password?: string }) {
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password) {
      throw new UnauthorizedException('Email e senha são obrigatórios');
    }

    const professional = await this.professionalRepository.findOneByEmail(email);
    if (!professional?.password) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordOk = await bcrypt.compare(password, professional.password);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const establishment = await this.prisma.establishment.findUnique({
      where: { id: professional.establishmentId },
      select: { id: true, name: true, slug: true },
    });

    const token = jwt.sign(
      {
        professionalId: professional.id,
        email: professional.email,
        type: 'professional',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return {
      token,
      professional: {
        id: professional.id,
        name: professional.name,
        email: professional.email,
        phone: professional.phone,
        establishmentId: professional.establishmentId,
      },
      establishment,
    };
  }
}
