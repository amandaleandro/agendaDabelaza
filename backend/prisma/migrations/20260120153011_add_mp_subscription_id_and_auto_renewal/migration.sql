/*
  Warnings:

  - A unique constraint covering the columns `[mp_subscription_id]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "auto_renewal" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mp_subscription_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_mp_subscription_id_key" ON "subscriptions"("mp_subscription_id");
