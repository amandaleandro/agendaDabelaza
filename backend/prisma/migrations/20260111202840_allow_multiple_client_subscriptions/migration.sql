-- DropIndex
DROP INDEX "client_subscriptions_user_id_establishment_id_key";

-- AlterTable
ALTER TABLE "client_subscriptions" ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "service_plan_id" TEXT;

-- CreateIndex
CREATE INDEX "client_subscriptions_service_plan_id_idx" ON "client_subscriptions"("service_plan_id");

-- CreateIndex
CREATE INDEX "client_subscriptions_status_idx" ON "client_subscriptions"("status");
