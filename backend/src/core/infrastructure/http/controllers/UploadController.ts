import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../database/prisma/PrismaService';
import { CloudinaryService } from '../../storage/CloudinaryService';

@Controller('uploads')
export class UploadController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveEstablishment(
    req: any,
    establishmentId?: string,
  ): Promise<{ id: string; slug: string | null }> {
    const ownerId = req.user?.ownerId;

    if (!ownerId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    if (!establishmentId) {
      throw new BadRequestException('establishmentId é obrigatório');
    }

    const establishment = await this.prisma.establishment.findFirst({
      where: {
        id: establishmentId,
        ownerId,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!establishment) {
      throw new UnauthorizedException(
        'Estabelecimento não encontrado para este usuário',
      );
    }

    return establishment;
  }

  @Post('image')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadImage(
    @UploadedFile() file: any,
    @Req() req: any,
    @Body('establishmentId') establishmentId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Apenas imagens são permitidas');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Arquivo muito grande (máximo 10MB)');
    }

    const establishment = await this.resolveEstablishment(req, establishmentId);
    const result = await this.cloudinaryService.uploadImage(
      file,
      this.cloudinaryService.buildEstablishmentFolder(establishment, 'uploads'),
    );

    return {
      success: true,
      url: result.url,
      publicId: result.publicId,
    };
  }

  @Post('logo')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadLogo(
    @UploadedFile() file: any,
    @Req() req: any,
    @Body('establishmentId') establishmentId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Apenas imagens são permitidas');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Arquivo muito grande (máximo 5MB)');
    }

    const establishment = await this.resolveEstablishment(req, establishmentId);
    const result = await this.cloudinaryService.uploadImage(
      file,
      this.cloudinaryService.buildEstablishmentFolder(establishment, 'logos'),
    );

    return {
      success: true,
      url: result.url,
      publicId: result.publicId,
    };
  }

  @Post('banner')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadBanner(
    @UploadedFile() file: any,
    @Req() req: any,
    @Body('establishmentId') establishmentId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Apenas imagens são permitidas');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Arquivo muito grande (máximo 10MB)');
    }

    const establishment = await this.resolveEstablishment(req, establishmentId);
    const result = await this.cloudinaryService.uploadImage(
      file,
      this.cloudinaryService.buildEstablishmentFolder(establishment, 'banners'),
    );

    return {
      success: true,
      url: result.url,
      publicId: result.publicId,
    };
  }

  @Post('gallery')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FilesInterceptor('files', 20))
  @HttpCode(HttpStatus.OK)
  async uploadGallery(
    @UploadedFiles() files: any[],
    @Req() req: any,
    @Body('establishmentId') establishmentId?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const validFiles = files.filter((file) => {
      if (!file.mimetype.startsWith('image/')) return false;
      if (file.size > 10 * 1024 * 1024) return false;
      return true;
    });

    if (validFiles.length === 0) {
      throw new BadRequestException('Nenhum arquivo válido foi encontrado');
    }

    const establishment = await this.resolveEstablishment(req, establishmentId);
    const results = await this.cloudinaryService.uploadMultiple(
      validFiles,
      this.cloudinaryService.buildEstablishmentFolder(establishment, 'gallery'),
    );

    return {
      success: true,
      images: results.map((result) => ({
        url: result.url,
        publicId: result.publicId,
      })),
    };
  }
}
