-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "key" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Lesson" ADD COLUMN "supersededByLessonId" TEXT;

-- Backfill keys for existing lessons.
UPDATE "Lesson" SET "key" = "slug" WHERE "key" IS NULL;

-- AlterTable
ALTER TABLE "Lesson" ALTER COLUMN "key" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_key_key" ON "Lesson"("key");

-- CreateIndex
CREATE INDEX "Lesson_supersededByLessonId_idx" ON "Lesson"("supersededByLessonId");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_supersededByLessonId_fkey" FOREIGN KEY ("supersededByLessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
