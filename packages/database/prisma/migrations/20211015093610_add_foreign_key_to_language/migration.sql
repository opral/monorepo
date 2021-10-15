-- AlterTable
ALTER TABLE "translation" ALTER COLUMN "text" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "translation" ADD CONSTRAINT "translation_project_id_iso_code_fkey" FOREIGN KEY ("project_id", "iso_code") REFERENCES "language"("project_id", "iso_code") ON DELETE CASCADE ON UPDATE CASCADE;
