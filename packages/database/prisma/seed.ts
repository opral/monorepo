import { PrismaClient } from "@prisma/client";
import { supabase, mockUser } from "../local.config";
/**
 * Creates a mock user if the user does not exist yet.
 *
 * If the user exists, the function 'fails' silently. Which
 * is not problematic since seeding only requires that the user
 * with the specific `mockEmail` exists.
 */
async function signInOrLogin(): Promise<void> {
  const signUp = await supabase.auth.signUp({
    email: mockUser.email,
    password: mockUser.password,
  });
  if (signUp.user?.id === null) {
    const signIn = await supabase.auth.signIn({
      email: mockUser.email,
      password: mockUser.password,
    });
    console.log(signIn);
  }
  if (signUp.error) {
    console.warn(signUp.error);
  }
}

async function main() {
  await signInOrLogin();
  const prisma = new PrismaClient();
  await prisma.organization.create({
    data: {
      name: "Acne Inc",
      created_by_user_id: supabase.auth.user()!.id,
      projects: {
        create: {
          name: "dev-project",
          api_key: "32j2f0onanf39-0001-9rj31nfwqm0-d0m02das",
          default_iso_code: "en",
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
                      iso_code: "en",
                      text: "Hello World",
                    },
                    {
                      iso_code: "de",
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
                      iso_code: "en",
                      text: "We welcome you to our platform.",
                      is_reviewed: true,
                    },
                    {
                      iso_code: "de",
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
                    { iso_code: "en", text: "Confirm", is_reviewed: true },
                    {
                      iso_code: "de",
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

main().catch((e) => console.error(e));
