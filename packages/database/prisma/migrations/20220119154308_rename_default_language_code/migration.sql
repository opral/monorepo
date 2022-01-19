/*
  Warnings:

  - The primary key for the `language` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `iso_code` on the `language` table. All the data in the column will be lost.
  - You are about to drop the column `default_iso_code` on the `project` table. All the data in the column will be lost.
  - Added the required column `code` to the `language` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source_language_code` to the `project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "language" DROP CONSTRAINT "language_pkey",
DROP COLUMN "iso_code",
ADD COLUMN     "code" "iso_639_1" NOT NULL,
ADD CONSTRAINT "language_pkey" PRIMARY KEY ("project_id", "code");

-- AlterTable
ALTER TABLE "project" DROP COLUMN "default_iso_code",
ADD COLUMN     "source_language_code" "iso_639_1" NOT NULL;
