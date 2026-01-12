-- Create products table
CREATE TABLE "products" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "professional_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "stock" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "products_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals" ("id") ON DELETE CASCADE
);

-- Create appointment_items table (many-to-many with prices)
CREATE TABLE "appointment_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "appointment_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "appointment_items_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON DELETE CASCADE,
  CONSTRAINT "appointment_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "products_professional_id_idx" ON "products"("professional_id");
CREATE INDEX "appointment_items_appointment_id_idx" ON "appointment_items"("appointment_id");
CREATE INDEX "appointment_items_product_id_idx" ON "appointment_items"("product_id");
