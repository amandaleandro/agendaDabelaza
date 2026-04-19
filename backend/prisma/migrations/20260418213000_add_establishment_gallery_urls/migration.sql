ALTER TABLE "establishments"
ADD COLUMN "gallery_urls" TEXT[] DEFAULT ARRAY[]::TEXT[];
