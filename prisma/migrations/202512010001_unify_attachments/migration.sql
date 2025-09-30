-- Unify attachments into a single polymorphic table
-- 1. Ensure supporting enum exists
DO $$
BEGIN
  CREATE TYPE "AttachmentEntityType" AS ENUM ('COMPLAINT', 'CITIZEN', 'USER', 'SERVICE_REQUEST', 'SYSTEM_CONFIG');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- 2. Rename existing uploadedAt column to createdAt for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'attachments' AND column_name = 'uploadedAt'
  ) THEN
    EXECUTE 'ALTER TABLE "attachments" RENAME COLUMN "uploadedAt" TO "createdAt"';
  END IF;
END;
$$;

-- 3. Add new columns needed for polymorphic association
ALTER TABLE "attachments"
  ADD COLUMN IF NOT EXISTS "entityType" "AttachmentEntityType",
  ADD COLUMN IF NOT EXISTS "entityId" TEXT,
  ADD COLUMN IF NOT EXISTS "uploadedById" TEXT;

-- 4. Relax complaintId to allow attachments targeting other entities
ALTER TABLE "attachments"
  ALTER COLUMN "complaintId" DROP NOT NULL;

-- 5. Set defaults and backfill existing rows
ALTER TABLE "attachments"
  ALTER COLUMN "entityType" SET DEFAULT 'COMPLAINT';

UPDATE "attachments"
SET "entityType" = COALESCE("entityType", 'COMPLAINT');

UPDATE "attachments"
SET "entityId" = COALESCE("entityId", "complaintId")
WHERE "entityId" IS NULL;

ALTER TABLE "attachments"
  ALTER COLUMN "entityType" SET NOT NULL,
  ALTER COLUMN "entityId" SET NOT NULL;

ALTER TABLE "attachments"
  ALTER COLUMN "createdAt" SET DEFAULT NOW();

-- 6. Establish foreign key for uploader
ALTER TABLE "attachments"
  ADD CONSTRAINT IF NOT EXISTS "attachments_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL;

-- 7. Create supporting indexes
CREATE INDEX IF NOT EXISTS "attachments_entityType_entityId_idx"
  ON "attachments" ("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "attachments_fileName_idx"
  ON "attachments" ("fileName");

-- 8. Drop legacy tables if they remain
DROP TABLE IF EXISTS "citizen_attachments";
DROP TABLE IF EXISTS "complaint_attachments";
