import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 *
 */
export async function translation_set_policies() {
    await prisma.$queryRawUnsafe(`
        ALTER TABLE public.translation ENABLE ROW LEVEL SECURITY;
    `);
    console.log("✅ applied policies for: translation table");
}
