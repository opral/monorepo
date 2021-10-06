import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 *
 */
export async function user_set_policies() {
    await prisma.$queryRawUnsafe(`
        ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;
    `);
    console.log("✅ applied policies for: user table");
}
