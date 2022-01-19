import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function project_member_set_policies() {
  await prisma.$queryRawUnsafe(`
        ALTER TABLE public.project_member ENABLE ROW LEVEL SECURITY;
    `);
  //is_member_of always returns true even when select exists evaluates to false
  await prisma.$queryRawUnsafe(`
        CREATE OR REPLACE FUNCTION public.is_member_of_project(project_id uuid) RETURNS bool AS $$
        SELECT project_id IN (
            SELECT om.project_id
            FROM project_member om
            WHERE om.user_id = auth.uid()
        );
        $$ LANGUAGE sql SECURITY DEFINER;
    `);

  await prisma.$queryRawUnsafe(`
    DROP POLICY IF EXISTS "user can act on records if member" on public.project_member;
`);
  await prisma.$queryRawUnsafe(`
        CREATE POLICY "user can act on records if member" ON public.project_member 
        FOR ALL
        USING ( 
            public.is_member_of_project(project_id) 
        );
    `);

  console.log("✅ applied policies for: project_member table");
}
