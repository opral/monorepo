import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Each time a new organization is created, a member with admin role
 * for that organization needs to be inserted.
 *
 */
export async function on_insert_project() {
  await prisma.$queryRawUnsafe(`
  create or replace function public.handle_insert_project()
    returns trigger as $$
    BEGIN
        insert into public.project_member (project_id, user_id)
        values (new.id, new.created_by_user_id);
        return new;
    END;
    $$ language plpgsql security definer;
  `);
  await prisma.$queryRawUnsafe(`
    DROP TRIGGER IF EXISTS on_project_insert on public.project
  `);
  await prisma.$queryRawUnsafe(`
      create trigger on_project_insert
      AFTER INSERT on public.project
      for each row execute procedure public.handle_insert_project();
    `);
  console.log("✅ applied trigger: on_insert_project");
}
