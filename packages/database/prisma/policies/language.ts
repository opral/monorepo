import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 *
 */
export async function language_set_policies() {
    await prisma.$queryRawUnsafe(`
        ALTER TABLE public.language ENABLE ROW LEVEL SECURITY;
    `);
    console.log("✅ applied policies for: language table");
}
