CREATE TABLE "whatsapp_reminders" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "recipient_phone" TEXT NOT NULL,
    "send_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_reminders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "whatsapp_reminders_appointment_id_idx" ON "whatsapp_reminders"("appointment_id");
CREATE INDEX "whatsapp_reminders_status_send_at_idx" ON "whatsapp_reminders"("status", "send_at");

ALTER TABLE "whatsapp_reminders"
ADD CONSTRAINT "whatsapp_reminders_appointment_id_fkey"
FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
