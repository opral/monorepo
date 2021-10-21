-- DropForeignKey
ALTER TABLE "translation" DROP CONSTRAINT "translation_project_id_fkey";

-- AddForeignKey
ALTER TABLE "translation" ADD CONSTRAINT "translation_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
