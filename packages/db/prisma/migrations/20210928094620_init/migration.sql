/*
  Warnings:

  - You are about to drop the column `owner_id` on the `Organization` table. All the data in the column will be lost.
  - Added the required column `name` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `admin_of` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Organization" DROP CONSTRAINT "Organization_owner_id_fkey";

-- DropIndex
DROP INDEX "Organization_owner_id_unique";

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "owner_id",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "admin_of" BOOLEAN NOT NULL;
