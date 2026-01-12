import { 
  Body, 
  Controller, 
  HttpCode, 
  HttpStatus, 
  Post, 
  NotFoundException, 
  UnauthorizedException,
  BadRequestException,
  Get, 
  Param 
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/PrismaService';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

@Controller('public/auth')
export class PublicAuthController {
  constructor(private readonly prisma: PrismaService) {}

  private generateToken(userId: string, email: string, establishmentId?: string): string {
    return jwt.sign(
      { sub: userId, email, type: 'client', establishmentId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string; establishmentSlug?: string }) {
    const { email, password, establishmentSlug } = body;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    let establishment = null as any;
    if (establishmentSlug) {
      establishment = await this.prisma.establishment.findUnique({ where: { slug: establishmentSlug } });
      if (!establishment) {
        throw new NotFoundException('Estabelecimento não encontrado');
      }
      // Garantir vínculo user-establishment
      await this.prisma.userEstablishment.upsert({
        where: {
          userId_establishmentId: {
            userId: user.id,
            establishmentId: establishment.id,
          },
        },
        update: {
          lastAppointmentAt: new Date(),
        },
        create: {
          userId: user.id,
          establishmentId: establishment.id,
          firstAppointmentAt: new Date(),
          lastAppointmentAt: new Date(),
        },
      });
    }

    const token = this.generateToken(user.id, user.email, establishment?.id);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      establishment: establishment
        ? { id: establishment.id, name: establishment.name, slug: establishment.slug }
        : undefined,
    };
  }

  @Get('check-email/:email')
  async checkEmail(@Param('email') email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true }
    });

    return {
      exists: !!user,
      user: user ? { id: user.id, email: user.email, name: user.name } : null
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: { 
    name: string; 
    email: string; 
    phone: string; 
    password: string; 
    establishmentSlug: string;
  }) {
    const { name, email, phone, password, establishmentSlug } = body;

    // Verificar se email já existe
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Este email já está cadastrado');
    }

    // Verificar se estabelecimento existe
    const establishment = await this.prisma.establishment.findUnique({ 
      where: { slug: establishmentSlug } 
    });
    if (!establishment) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    // Validações
    if (!name || !name.trim()) {
      throw new BadRequestException('Nome é obrigatório');
    }
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Email inválido');
    }
    if (!phone || !phone.trim()) {
      throw new BadRequestException('Telefone é obrigatório');
    }
    if (!password || password.length < 6) {
      throw new BadRequestException('Senha deve ter pelo menos 6 caracteres');
    }

    // Criar usuário
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        id: require('crypto').randomUUID(),
        name,
        email,
        phone,
        password: hashedPassword,
      },
    });

    // Vincular ao estabelecimento
    await this.prisma.userEstablishment.create({
      data: {
        userId: user.id,
        establishmentId: establishment.id,
        firstAppointmentAt: new Date(),
        lastAppointmentAt: new Date(),
      },
    });

    // Gerar token
    const token = this.generateToken(user.id, user.email, establishment.id);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      establishment: {
        id: establishment.id,
        name: establishment.name,
        slug: establishment.slug,
      },
    };
  }
}
