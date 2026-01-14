-- CreateIndex
CREATE INDEX IF NOT EXISTS "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "appointments_created_at_idx" ON "appointments"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "appointments_establishment_id_status_idx" ON "appointments"("establishment_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "appointments_establishment_id_created_at_idx" ON "appointments"("establishment_id", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_created_at_idx" ON "payments"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_status_created_at_idx" ON "payments"("status", "created_at");
