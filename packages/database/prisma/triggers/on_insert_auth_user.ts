import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Creates a trigger on auth.users that executes a function
 * that in turn creates a user in public.users and cascades deletes
 * from auth.users to public.user
 *
 * Supabase uses an internal `auth.users` table for all `supabase.auth`
 * related queries or mutations. This trigger and corresponding function
 * ensures that whenever a new user is created with supabase.auth, that user
 * is also created in public.users.
 *
 */
export async function on_insert_auth_user() {
  await prisma.$queryRawUnsafe(`
  create or replace function public.handle_insert_user() 
    returns trigger as $$
    begin
        insert into public.user (id, email)
        values (new.id, new.email);
        return new;
    end;
    $$ language plpgsql security definer;
  `);
  // dropping a trigger from foreign schema is not possbile without permissions
  // await prisma.$queryRawUnsafe(`
  //   DROP TRIGGER IF EXISTS on_auth_user_created on auth.users
  // `);
  try {
    await prisma.$queryRawUnsafe(`
      create trigger on_insert_auth_user
      after insert on auth.users
      for each row execute procedure public.handle_insert_user();
    `);
  } catch (e) {
    // trigger exists already
    //@ts-ignore
    if (e.code !== "P2010") {
      throw e;
    }
  }
  //* currently foreign keys to schemas outside of public are unsupported by prisma
  //* https://github.com/prisma/prisma/issues/1175
  // await prisma.$queryRawUnsafe(`
  // DO $$
  // BEGIN
  //     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'auth_users_id_fkey') THEN
  //         ALTER TABLE public.user
  //             ADD CONSTRAINT auth_users_id_fkey
  //             FOREIGN KEY (id) REFERENCES auth.users(id)
  //             ON DELETE CASCADE;
  //     END IF;
  // END;
  // $$;
  // `);
  console.log("✅ applied trigger: on_insert_auth_user");
}
