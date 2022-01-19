import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 *
 */
export async function language_set_policies() {
  await prisma.$queryRawUnsafe(`
        ALTER TABLE public.language ENABLE ROW LEVEL SECURITY;
    `);
  await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS "user can act on language if project member" ON public.language;
    `);
  await prisma.$queryRawUnsafe(`
        CREATE POLICY "user can act on language if project member" ON public.language
        FOR ALL
        USING (
            project_id IN
            (
                SELECT project.id
                FROM project_member left join project 
                ON user_id = auth.uid()
            ) 
        )
    `);
  console.log("✅ applied policies for: language table");
}
