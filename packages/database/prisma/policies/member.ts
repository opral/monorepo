import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 *
 */
export async function member_set_policies() {
    await prisma.$queryRawUnsafe(`
        ALTER TABLE public.member ENABLE ROW LEVEL SECURITY;
    `);
    console.log("✅ applied policies for: member table");
}
