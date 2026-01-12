/*
  Warnings:

  - You are about to drop the column `client_id` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `platform_fee` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `professional_amount` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `transfer_id` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `professionals` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[appointment_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[establishment_id,email]` on the table `professionals` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `establishment_id` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `establishment_id` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `establishment_id` to the `professionals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `establishment_id` to the `schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `establishment_id` to the `services` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "appointment_items" DROP CONSTRAINT "appointment_items_appointment_id_fkey";

-- DropForeignKey
ALTER TABLE "appointment_items" DROP CONSTRAINT "appointment_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_professional_id_fkey";

-- DropIndex
DROP INDEX "professionals_user_id_idx";

-- DropIndex
DROP INDEX "professionals_user_id_key";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "client_id",
ADD COLUMN     "establishment_id" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
ALTER COLUMN "duration_minutes" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "platform_fee",
DROP COLUMN "professional_amount",
DROP COLUMN "transfer_id";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "establishment_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "professionals" DROP COLUMN "user_id",
ADD COLUMN     "establishment_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "establishment_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "establishment_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "establishments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "primary_color" TEXT NOT NULL DEFAULT '#3B82F6',
    "secondary_color" TEXT NOT NULL DEFAULT '#1F2937',
    "logo_url" TEXT,
    "banner_url" TEXT,
    "bio" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "establishments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_establishments" (
    "user_id" TEXT NOT NULL,
    "establishment_id" TEXT NOT NULL,
    "first_appointment_at" TIMESTAMP(3),
    "last_appointment_at" TIMESTAMP(3),

    CONSTRAINT "user_establishments_pkey" PRIMARY KEY ("user_id","establishment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "establishments_slug_key" ON "establishments"("slug");

-- CreateIndex
CREATE INDEX "establishments_owner_id_idx" ON "establishments"("owner_id");

-- CreateIndex
CREATE INDEX "establishments_slug_idx" ON "establishments"("slug");

-- CreateIndex
CREATE INDEX "user_establishments_establishment_id_idx" ON "user_establishments"("establishment_id");

-- CreateIndex
CREATE INDEX "appointments_user_id_idx" ON "appointments"("user_id");

-- CreateIndex
CREATE INDEX "appointments_establishment_id_idx" ON "appointments"("establishment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_appointment_id_key" ON "payments"("appointment_id");

-- CreateIndex
CREATE INDEX "products_establishment_id_idx" ON "products"("establishment_id");

-- CreateIndex
CREATE INDEX "professionals_establishment_id_idx" ON "professionals"("establishment_id");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_establishment_id_email_key" ON "professionals"("establishment_id", "email");

-- CreateIndex
CREATE INDEX "schedules_establishment_id_idx" ON "schedules"("establishment_id");

-- CreateIndex
CREATE INDEX "services_establishment_id_idx" ON "services"("establishment_id");

-- AddForeignKey
ALTER TABLE "user_establishments" ADD CONSTRAINT "user_establishments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_establishments" ADD CONSTRAINT "user_establishments_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_items" ADD CONSTRAINT "appointment_items_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_items" ADD CONSTRAINT "appointment_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
