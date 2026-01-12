-- DropIndex
DROP INDEX "schedules_professional_id_day_of_week_key";

-- AlterTable
ALTER TABLE "establishments" ADD COLUMN     "deposit_percent" INTEGER DEFAULT 0;
