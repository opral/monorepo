/*
  Warnings:

  - You are about to drop the column `api_key` on the `project` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "project_api_key_key";

-- AlterTable
ALTER TABLE "project" DROP COLUMN "api_key";
