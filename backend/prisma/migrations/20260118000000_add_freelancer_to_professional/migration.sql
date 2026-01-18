-- AddColumn freelancer to Professional
ALTER TABLE "professionals" ADD COLUMN "freelancer" BOOLEAN NOT NULL DEFAULT false;
