import { Module } from '@nestjs/common';
import { UploadController } from '../core/infrastructure/http/controllers/UploadController';
import { CloudinaryService } from '../core/infrastructure/storage/CloudinaryService';

@Module({
  providers: [CloudinaryService],
  controllers: [UploadController],
  exports: [CloudinaryService],
})
export class UploadModule {}
