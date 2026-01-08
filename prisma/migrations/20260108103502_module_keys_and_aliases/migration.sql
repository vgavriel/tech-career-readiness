-- AlterTable
ALTER TABLE "Module" ADD COLUMN "key" TEXT;
ALTER TABLE "Module" ADD COLUMN "slug" TEXT;

-- Backfill
UPDATE "Module"
SET "key" = trim(both '-' from regexp_replace(lower("title"), '[^a-z0-9]+', '-', 'g'))
WHERE "key" IS NULL;

UPDATE "Module"
SET "slug" = "key"
WHERE "slug" IS NULL;

-- AlterTable
ALTER TABLE "Module" ALTER COLUMN "key" SET NOT NULL;
ALTER TABLE "Module" ALTER COLUMN "slug" SET NOT NULL;

-- CreateTable
CREATE TABLE "ModuleSlugAlias" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModuleSlugAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Module_key_key" ON "Module"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Module_slug_key" ON "Module"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Module_cohortId_order_key" ON "Module"("cohortId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_moduleId_order_key" ON "Lesson"("moduleId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleSlugAlias_slug_key" ON "ModuleSlugAlias"("slug");

-- AddForeignKey
ALTER TABLE "ModuleSlugAlias" ADD CONSTRAINT "ModuleSlugAlias_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
