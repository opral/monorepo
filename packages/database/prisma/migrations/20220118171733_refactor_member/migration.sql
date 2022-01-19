/*
  Warnings:

  - You are about to drop the column `organization_id` on the `project` table. All the data in the column will be lost.
  - You are about to drop the `member` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organization` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `created_by_user_id` to the `project` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "member" DROP CONSTRAINT "member_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "member" DROP CONSTRAINT "member_user_id_fkey";

-- DropForeignKey
ALTER TABLE "project" DROP CONSTRAINT "project_organization_id_fkey";

-- AlterTable
ALTER TABLE "project" DROP COLUMN "organization_id",
ADD COLUMN     "created_by_user_id" UUID NOT NULL;

-- DropTable
DROP TABLE "member";

-- DropTable
DROP TABLE "organization";

-- DropEnum
DROP TYPE "member_role";

-- CreateTable
CREATE TABLE "project_member" (
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "project_member_pkey" PRIMARY KEY ("project_id","user_id")
);

-- AddForeignKey
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
