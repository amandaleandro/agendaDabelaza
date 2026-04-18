ALTER TABLE "professionals"
ADD COLUMN "password" TEXT;

CREATE TABLE "appointment_service_items" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_service_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointment_service_items_appointment_id_idx" ON "appointment_service_items"("appointment_id");
CREATE INDEX "appointment_service_items_service_id_idx" ON "appointment_service_items"("service_id");

ALTER TABLE "appointment_service_items"
ADD CONSTRAINT "appointment_service_items_appointment_id_fkey"
FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointment_service_items"
ADD CONSTRAINT "appointment_service_items_service_id_fkey"
FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
