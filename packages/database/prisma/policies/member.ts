import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 *
 */
export async function member_set_policies() {
    await prisma.$queryRawUnsafe(`
        ALTER TABLE public.member ENABLE ROW LEVEL SECURITY;
    `);
    await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS "user select self" on public.member;
    `);
    await prisma.$queryRawUnsafe(`
        CREATE POLICY "user select self" ON public.member 
        FOR SELECT
        USING (
            auth.uid() = user_id
        );
    `);
    console.log("✅ applied policies for: member table");
}
