import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { definitions } from "../types/definitions";

/**
 *
 * @returns mock user id (uuid)
 */
async function createMockUser(): Promise<string> {
  const anonKey =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYwMzk2ODgzNCwiZXhwIjoyNTUwNjUzNjM0LCJyb2xlIjoiYW5vbiJ9.36fUebxgx1mcBo4s19v0SzqmzunP--hm_hep0uLX0ew";
  const supabase = createClient("http://localhost:8000", anonKey);
  const signUp = await supabase.auth.signUp({ email: "dev@inlang.dev" });
  if (signUp.error) {
    throw signUp.error;
  } else if (signUp.data === null) {
    throw "Mock user is null";
  }
  // manually upserting newly created user since no automatic
  // insertion from the table `(supabase).auth.user` to `public.user` exists yet. 
  const upsert = await supabase
    .from<definitions["user"]>("user")
    .upsert({ id: signUp!.user!.id, email: signUp!.user!.email! });
  if (upsert.error){
    throw upsert.error
  }
  return signUp!.user!.id;
}

async function main() {
  const mockUserId = await createMockUser();
  const prisma = new PrismaClient();
  await prisma.organization.create({
    data: {
      name: "Acne Inc",
      admin: {
        connect: {},
      },
      projects: {
        create: {
          name: "dev-project",
          api_key: "32j2f0onanf39-0001-9rj31nfwqm0-d0m02das",
          default_language_iso: "en",
          languages: {
            createMany: { data: [{ iso_code: "en" }, { iso_code: "de" }] },
          },
          keys: {
            create: [
              {
                name: "example.hello",
                translations: {
                  create: [
                    {
                      language_iso: "en",
                      text: "Hello World",
                    },
                    {
                      language_iso: "de",
                      text: "Hallo Welt",
                      is_reviewed: false,
                    },
                  ],
                },
              },
              {
                name: "welcome.first",
                translations: {
                  create: [
                    {
                      language_iso: "en",
                      text: "We welcome you to our platform.",
                      is_reviewed: true,
                    },
                    {
                      language_iso: "de",
                      text: "Willkommen zu unserer Platform",
                      is_reviewed: true,
                    },
                  ],
                },
              },
              {
                name: "button.confirm",
                translations: {
                  create: [
                    { language_iso: "en", text: "Confirm", is_reviewed: true },
                    {
                      language_iso: "de",
                      text: "Bestätigen",
                      is_reviewed: false,
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
  });
}

main();
