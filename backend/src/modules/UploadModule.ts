import { Module } from '@nestjs/common';
import { UploadController } from '../core/infrastructure/http/controllers/UploadController';
import { PrismaService } from '../core/infrastructure/database/prisma/PrismaService';
import { CloudinaryService } from '../core/infrastructure/storage/CloudinaryService';

@Module({
  providers: [CloudinaryService, PrismaService],
  controllers: [UploadController],
  exports: [CloudinaryService],
})
export class UploadModule {}
