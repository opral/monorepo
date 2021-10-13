import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 *
 */
export async function member_set_policies() {
    await prisma.$queryRawUnsafe(`
        ALTER TABLE public.member ENABLE ROW LEVEL SECURITY;
    `);
    //is_member_of always returns true even when select exists evaluates to false
    await prisma.$queryRawUnsafe(`
        CREATE OR REPLACE FUNCTION public.is_member_of(organization_id uuid) RETURNS bool AS $$
        SELECT organization_id IN (
            SELECT om.organization_id
            FROM member om
            WHERE om.user_id = auth.uid()
        );
        $$ LANGUAGE sql SECURITY DEFINER;
    `);
    await prisma.$queryRawUnsafe(`
    CREATE OR REPLACE FUNCTION public.is_admin_of(organization_id uuid) RETURNS bool AS $$
    SELECT organization_id IN (
        SELECT om.organization_id
        FROM member om
        WHERE om.user_id = auth.uid()
        AND om.role = 'ADMIN'
    );
    $$ LANGUAGE sql SECURITY DEFINER;
    `)
    await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS "user select coworkers" on public.member;
    `);
    await prisma.$queryRawUnsafe(`
        CREATE POLICY "user select coworkers" ON public.member 
        FOR SELECT
        USING ( 
            public.is_member_of(organization_id) 
        );
    `);
    await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS "admin CRUD member" ON public.member
    `)
    await prisma.$queryRawUnsafe(`
        CREATE POLICY "admin CRUD member" ON public.member
        FOR ALL
        USING (
            public.is_admin_of(organization_id)
        );
    `)
    console.log("✅ applied policies for: member table");
}
