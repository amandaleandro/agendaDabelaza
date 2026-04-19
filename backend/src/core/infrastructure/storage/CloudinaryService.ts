import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private sanitizeFolderSegment(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  buildEstablishmentFolder(
    establishment: { id: string; slug?: string | null },
    category: string,
  ): string {
    const slug = this.sanitizeFolderSegment(establishment.slug || establishment.id);
    const suffix = this.sanitizeFolderSegment(establishment.id).slice(-8);
    const folderName = suffix ? `${slug}-${suffix}` : slug;
    return `agendei/establishments/${folderName}/${this.sanitizeFolderSegment(category)}`;
  }

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    file: any,
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
    files: any[],
    folder: string = 'agendei',
  ): Promise<Array<{ url: string; publicId: string }>> {
    return Promise.all(
      files.map((file) => this.uploadImage(file, folder)),
    );
  }
}
