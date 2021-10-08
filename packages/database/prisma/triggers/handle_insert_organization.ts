import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Each time a new organization is created, a member with admin role
 * for that organization needs to be inserted.
 *
 */
export async function handle_insert_organization() {
  await prisma.$queryRawUnsafe(`
  create or replace function public.handle_insert_organization() 
    returns trigger as $$
    begin
        insert into public.member (organization_id, user_id, role)
        values (new.id, new.created_by_user_id, 'ADMIN');
        return new;
    end;
    $$ language plpgsql security definer;
  `);
  await prisma.$queryRawUnsafe(`
    DROP TRIGGER IF EXISTS on_organization_created on public.organization
  `);
  await prisma.$queryRawUnsafe(`
      create trigger on_organization_created
      after insert on public.organization
      for each row execute procedure public.handle_insert_organization();
    `);
  console.log("✅ applied trigger: handle_insert_organization");
}
