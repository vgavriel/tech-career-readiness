-- AlterTable
ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "LessonProgressAction" AS ENUM ('completed', 'incomplete');

-- CreateTable
CREATE TABLE "LessonProgressEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "action" "LessonProgressAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonProgressEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonProgressEvent_userId_createdAt_idx" ON "LessonProgressEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LessonProgressEvent_lessonId_createdAt_idx" ON "LessonProgressEvent"("lessonId", "createdAt");

-- AddForeignKey
ALTER TABLE "LessonProgressEvent" ADD CONSTRAINT "LessonProgressEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgressEvent" ADD CONSTRAINT "LessonProgressEvent_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
