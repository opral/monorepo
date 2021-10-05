import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 *
 */
export async function key_set_policies() {
    await prisma.$queryRawUnsafe(`
        ALTER TABLE public.key ENABLE ROW LEVEL SECURITY;
    `);
    console.log("✅ applied policies for: key table");
}
