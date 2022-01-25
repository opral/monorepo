import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * User can only see projects that they are admin of
 */
export async function projects_set_policies() {
  await prisma.$queryRawUnsafe(`
        ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;
    `);

  await prisma.$queryRawUnsafe(`
    DROP POLICY IF EXISTS "user can insert project" ON public.project;
`);
  await prisma.$queryRawUnsafe(`
    CREATE POLICY "user can insert project" ON public.project 
    FOR ALL 
        USING (
          auth.uid() = created_by_user_id
    );
`);

  await prisma.$queryRawUnsafe(`
  DROP POLICY IF EXISTS "user can select project before membership has been inserted" ON public.project;
`);
  await prisma.$queryRawUnsafe(`
  CREATE POLICY "user can select project before membership has been inserted" ON public.project 
  FOR ALL 
      USING (
        auth.uid() = created_by_user_id
  );
`);

  await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS user_can_act_on_projects_if_member ON public.project;
    `);
  await prisma.$queryRawUnsafe(`
        CREATE POLICY user_can_act_on_projects_if_member ON public.project 
        FOR ALL 
            USING (
                id IN (
                    SELECT project_member.project_id
                    FROM project_member
                    WHERE project_member.user_id = auth.uid()
                )
        );
    `);
  console.log("✅ applied policies for: project table");
}
