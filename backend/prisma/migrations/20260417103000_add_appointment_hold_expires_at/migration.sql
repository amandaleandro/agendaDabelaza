ALTER TABLE "appointments"
ADD COLUMN "hold_expires_at" TIMESTAMP(3);

CREATE INDEX "appointments_hold_expires_at_idx" ON "appointments"("hold_expires_at");
