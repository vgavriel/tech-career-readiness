ALTER TABLE "Lesson" ADD COLUMN "googleDocId" TEXT;

CREATE UNIQUE INDEX "Lesson_googleDocId_key" ON "Lesson"("googleDocId");
