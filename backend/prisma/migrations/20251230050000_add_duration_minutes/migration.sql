-- Add duration_minutes to appointments to store booked service length
ALTER TABLE "appointments" ADD COLUMN "duration_minutes" INTEGER NOT NULL DEFAULT 30;
