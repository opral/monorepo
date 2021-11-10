/*
  Warnings:

  - You are about to drop the `key` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `translation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "key" DROP CONSTRAINT "key_project_id_fkey";

-- DropForeignKey
ALTER TABLE "translation" DROP CONSTRAINT "translation_key_name_project_id_fkey";

-- DropForeignKey
ALTER TABLE "translation" DROP CONSTRAINT "translation_project_id_fkey";

-- DropForeignKey
ALTER TABLE "translation" DROP CONSTRAINT "translation_project_id_iso_code_fkey";

-- AlterTable
ALTER TABLE "language" ADD COLUMN     "file" TEXT NOT NULL DEFAULT E'';

-- DropTable
DROP TABLE "key";

-- DropTable
DROP TABLE "translation";
