import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$queryRaw`create or replace function public.handle_new_user() 
                        returns trigger as $$
                        begin
                            insert into public.user (id, name)
                            values (new.id, new.email);
                            return new;
                        end;
                        $$ language plpgsql security definer;`;
  await prisma.$queryRaw`DROP TRIGGER IF EXISTS on_auth_user_created on auth.users`;
  await prisma.$queryRaw`create trigger on_auth_user_created
                        after insert on auth.users
                        for each row execute procedure public.handle_new_user();`;
}
main();
