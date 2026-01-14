import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../../storage/CloudinaryService';

@Controller('uploads')
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Apenas imagens são permitidas');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Arquivo muito grande (máximo 10MB)');
    }

    const result = await this.cloudinaryService.uploadImage(
      file,
      'agendei/uploads',
    );

    return {
      success: true,
      url: result.url,
      publicId: result.publicId,
    };
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Apenas imagens são permitidas');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Arquivo muito grande (máximo 5MB)');
    }

    const result = await this.cloudinaryService.uploadImage(file, 'agendei/logos');

    return {
      success: true,
      url: result.url,
      publicId: result.publicId,
    };
  }

  @Post('banner')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadBanner(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Apenas imagens são permitidas');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Arquivo muito grande (máximo 10MB)');
    }

    const result = await this.cloudinaryService.uploadImage(
      file,
      'agendei/banners',
    );

    return {
      success: true,
      url: result.url,
      publicId: result.publicId,
    };
  }

  @Post('gallery')
  @UseInterceptors(FilesInterceptor('files', 20)) // Máximo 20 arquivos
  @HttpCode(HttpStatus.OK)
  async uploadGallery(@UploadedFiles() files: Express.Multer.File[]) {
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

    const results = await this.cloudinaryService.uploadMultiple(
      validFiles,
      'agendei/gallery',
    );

    return {
      success: true,
      images: results.map((r) => ({
        url: r.url,
        publicId: r.publicId,
      })),
    };
  }
}
