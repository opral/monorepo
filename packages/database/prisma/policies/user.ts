import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 *
 */
export async function user_set_policies() {
    await prisma.$queryRawUnsafe(`
        ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;
    `);
    await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS "user select user" ON public.user;
    `);
    await prisma.$queryRawUnsafe(`
        CREATE POLICY "user select user" ON public.user
        FOR SELECT
        USING (
            auth.uid() = id
        );
    `);
    await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS "user update user" ON public.user;
    `);
    await prisma.$queryRawUnsafe(`
        CREATE POLICY "user update user" ON public.user
        FOR UPDATE
        USING (
            auth.uid() = id
        );
    `);
    console.log("✅ applied policies for: user table");
}
