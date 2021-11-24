/*
  Warnings:

  - A unique constraint covering the columns `[api_key]` on the table `project` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "project" ADD COLUMN     "api_key" UUID NOT NULL DEFAULT gen_random_uuid();

-- CreateIndex
CREATE UNIQUE INDEX "project_api_key_key" ON "project"("api_key");
