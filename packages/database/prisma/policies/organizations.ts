import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * User can only see organizations they are part of
 *
 */
export async function organization_set_policies() {
    await prisma.$queryRawUnsafe(`
        ALTER TABLE public.organization ENABLE ROW LEVEL SECURITY;
    `);
    await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS user_get_own_organizations ON public.organization;
    `);
    await prisma.$queryRawUnsafe(`
        CREATE POLICY user_get_own_organizations ON public.organization 
        FOR SELECT
        USING (
            auth.uid() IN (
                SELECT member.user_id
                FROM member
                WHERE member.organization_id = id
            ) 
        );
    `);
    await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS "user insert organization" ON public.organization;
    `);
    await prisma.$queryRawUnsafe(`
        CREATE POLICY "user insert organization" ON public.organization 
        FOR INSERT
        WITH CHECK (
            created_by_user_id = auth.uid()
        );
    `);
    await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS "owner delete organization" on public.organization;
    `);
    await prisma.$queryRawUnsafe(`
        CREATE POLICY "owner for all organization" on public.organization
        FOR ALL
        USING (
            created_by_user_id = auth.uid()
        );
    `);
    console.log("✅ applied policies for: organization table");
}
