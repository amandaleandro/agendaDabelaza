/*
  Warnings:

  - A unique constraint covering the columns `[mercadopago_id]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `establishment_amount` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `establishment_id` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "establishments" ADD COLUMN     "mercadopago_account_id" TEXT,
ADD COLUMN     "platform_fee_percent" DOUBLE PRECISION NOT NULL DEFAULT 10.0;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "establishment_amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "payment_method" TEXT,
ADD COLUMN     "payment_url" TEXT,
ADD COLUMN     "pix_qr_code" TEXT,
ADD COLUMN     "pix_qr_code_base64" TEXT,
ADD COLUMN     "platform_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "billing_cycle" TEXT NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "establishment_id" TEXT NOT NULL,
ADD COLUMN     "mercadopago_id" TEXT,
ADD COLUMN     "next_billing_date" TIMESTAMP(3),
ADD COLUMN     "payment_method" TEXT,
ADD COLUMN     "platform_fee_percent" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "trial_ends_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_transaction_id_idx" ON "payments"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_mercadopago_id_key" ON "subscriptions"("mercadopago_id");

-- CreateIndex
CREATE INDEX "subscriptions_establishment_id_idx" ON "subscriptions"("establishment_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
