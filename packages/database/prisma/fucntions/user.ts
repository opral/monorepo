import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 *
 */
export async function initUserFunctions() {
    await prisma.$queryRawUnsafe(`
        CREATE OR REPLACE FUNCTION public.get_user_id_from_email(email VARCHAR(100))
        RETURNS uuid AS $$
        SELECT id
        FROM public.user U
        WHERE U.email = email;
        $$ LANGUAGE sql SECURITY DEFINER;
    `);
        console.log("✅ applied functions for: user table");
}
