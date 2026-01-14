import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'agendei',
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          max_bytes: 10 * 1024 * 1024, // 10MB max
        },
        (error, result) => {
          if (error) reject(error);
          else {
            resolve({
              url: result!.secure_url,
              publicId: result!.public_id,
            });
          }
        },
      );

      stream.end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    folder: string = 'agendei',
  ): Promise<Array<{ url: string; publicId: string }>> {
    return Promise.all(
      files.map((file) => this.uploadImage(file, folder)),
    );
  }
}
