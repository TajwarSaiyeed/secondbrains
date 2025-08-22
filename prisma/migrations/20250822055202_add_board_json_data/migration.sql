-- AlterTable
ALTER TABLE "public"."boards" ADD COLUMN     "files_data" JSONB,
ADD COLUMN     "links_data" JSONB,
ADD COLUMN     "notes_data" JSONB;
