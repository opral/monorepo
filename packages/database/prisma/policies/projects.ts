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
        DROP POLICY IF EXISTS user_get_own_admin_projects ON public.project;
    `);
    await prisma.$queryRawUnsafe(`
        CREATE POLICY user_get_own_admin_projects ON public.project 
        FOR ALL
        USING (
            organization_id IN (
                SELECT member.organization_id
                FROM member
                WHERE member.user_id = auth.uid() AND member.role = 'ADMIN'
            )
        );
    `);
    await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS user_get_own_projects ON public.project;
    `);
    await prisma.$queryRawUnsafe(`
        CREATE POLICY user_get_own_projects ON public.project 
        FOR SELECT 
            USING (
                organization_id IN (
                    SELECT member.organization_id
                    FROM member
                    WHERE member.user_id = auth.uid()
                )
        );
    `);
  console.log("✅ applied policies for: project table");
}
