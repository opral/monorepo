import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 *
 */
export async function translation_set_policies() {
    await prisma.$queryRawUnsafe(`
        ALTER TABLE public.translation ENABLE ROW LEVEL SECURITY;
    `);
    await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS "user all" ON public.translation;
    `)
    await prisma.$queryRawUnsafe(`
        CREATE POLICY "user all" ON public.translation
        FOR ALL
        USING (
            key_id IN (
                SELECT id FROM key
            )
        );
    `);
    console.log("✅ applied policies for: translation table");
}
