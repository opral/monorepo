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
    CREATE OR REPLACE FUNCTION public.is_member_of(user_id uuid, organization_id uuid) RETURNS bool AS $$
    SELECT EXISTS (
        SELECT 1
        FROM member om
        WHERE om.organization_id = organization_id
        AND om.user_id = user_id
    );
    $$ LANGUAGE sql SECURITY DEFINER;
    `);
    await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS "user select coworkers" on public.member;
    `);
    await prisma.$queryRawUnsafe(`
        CREATE POLICY "user select coworkers" ON public.member 
        FOR SELECT
        USING ( 
            public.is_member_of(auth.uid(), organization_id) 
        );
    `);
    console.log("✅ applied policies for: member table");
}
