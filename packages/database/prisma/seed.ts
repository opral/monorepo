import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.organization.create({
    data: {
      name: "Acne Inc",
      admin: {
        create: { email: "dev@inlang.dev" },
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
