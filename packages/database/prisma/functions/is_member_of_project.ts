import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function apply_is_member_of_project() {
  await prisma.$queryRawUnsafe(`
        CREATE OR REPLACE FUNCTION public.is_member_of_project(project_id uuid) RETURNS bool AS $$
        SELECT project_id IN (
            SELECT om.project_id
            FROM project_member om
            WHERE om.user_id = auth.uid()
        );
        $$ LANGUAGE sql SECURITY DEFINER;
    `);
  console.log("✅ applied function: is_member_of_project()");
}
