/*
  Warnings:

  - You are about to drop the column `admin_of` on the `User` table. All the data in the column will be lost.
  - Added the required column `isAdmin` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "admin_of",
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL;
