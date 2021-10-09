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
        DROP POLICY IF EXISTS "user select language" ON public.language;
    `);
    await prisma.$queryRawUnsafe(`
        CREATE POLICY "user select language" ON public.language
        FOR SELECT
        USING (
            project_id IN
            (
                SELECT project.id
                FROM member left join project 
                ON user_id = auth.uid()
            ) 
        )
    `);
    await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS "admin full access" ON public.language;
    `);
    await prisma.$queryRawUnsafe(`
        CREATE POLICY "admin full access" ON public.language
        FOR ALL
        USING (
            project_id IN
            (
                SELECT project.id
                FROM member LEFT JOIN project
                ON member.organization_id = project.organization_id
                WHERE user_id = auth.uid() AND role = 'ADMIN'
            ) 
        );
    `);
    console.log("✅ applied policies for: language table");
}
