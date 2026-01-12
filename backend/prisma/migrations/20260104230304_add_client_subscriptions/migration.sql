-- CreateTable
CREATE TABLE "client_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "establishment_id" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "total_credits" INTEGER NOT NULL,
    "used_credits" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_subscriptions_user_id_idx" ON "client_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "client_subscriptions_establishment_id_idx" ON "client_subscriptions"("establishment_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_subscriptions_user_id_establishment_id_key" ON "client_subscriptions"("user_id", "establishment_id");
