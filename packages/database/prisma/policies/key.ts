import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 *
 */
export async function key_set_policies() {
    await prisma.$queryRawUnsafe(`
        ALTER TABLE public.key ENABLE ROW LEVEL SECURITY;
    `);
    await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS "user select keys" ON public.key;
    `);
    await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS "user all keys" ON public.key;
    `);
    await prisma.$queryRawUnsafe(`
        CREATE POLICY "user select keys" ON public.key
        FOR SELECT
        USING (
            project_id IN (
                SELECT id FROM project
            )
        );
    `);
    await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS "admin full access" ON public.key;
    `);
    await prisma.$queryRawUnsafe(`
        CREATE POLICY "admin full access" ON public.key
        FOR ALL
        USING (
            project_id IN (
                SELECT id
                FROM project LEFT JOIN member on project.organization_id = member.organization_id
                WHERE member.user_id = auth.uid() AND member.role = 'ADMIN'
            )
        );
    `);
    console.log("✅ applied policies for: key table");
}
