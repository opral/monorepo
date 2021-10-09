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
        DROP POLICY IF EXISTS "user select member" on public.member;
    `)
    await prisma.$queryRawUnsafe(`
        CREATE POLICY "user select member" ON public.member 
        FOR ALL
        USING (
            auth.uid() = user_id
        );
    `);
    await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS "user select coworkers" on public.member;
    `)
    /*await prisma.$queryRawUnsafe(`
        CREATE POLICY "user select coworkers" ON public.member 
        FOR SELECT
        USING (
            organization_id IN ( 
                SELECT organization_id
                FROM member AS sub_member
                WHERE auth.uid() = sub_member.user_id
            )
        );
    `);*/
    await prisma.$queryRawUnsafe(`
        DROP POLICY IF EXISTS "admin all member" on public.member;
    `);
    /*await prisma.$queryRawUnsafe(`
        CREATE POLICY "admin all member" on public.member
        FOR ALL
        USING (
            organization_id IN ( 
                SELECT organization_id 
                FROM member 
                WHERE user_id = auth.uid() 
                    AND role = 'ADMIN'
                )
        );
    `);*/
    console.log("✅ applied policies for: member table");
}
