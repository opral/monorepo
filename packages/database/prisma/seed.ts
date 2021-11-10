import { PrismaClient, member_role } from "@prisma/client";
import { supabase, mockUser, mockUser2, MockUser } from "../local.config";
import { definitions } from "../types/definitions";
/**
 * Creates a mock user if the user does not exist yet.
 */
async function signUpMockUser(user: MockUser): Promise<void> {
  // fails silenently if user exists already -> does not matter
  const signUp = await supabase.auth.signUp({
    email: user.email,
    password: user.password,
  });
  const signIn = await supabase.auth.signIn({
    email: user.email,
    password: user.password,
  });
  if (signIn.error || signIn.user === null) {
    console.error(signIn.error);

    throw signIn.error ?? "user is null";
  }
}

async function signOutUser() {
  const signOut = await supabase.auth.signOut();
  if (signOut.error) {
    console.log(signOut.error.message);
    throw signOut.error;
  }
}

async function main() {
  console.log("applying seeds...");
  await signUpMockUser(mockUser);
  const prisma = new PrismaClient();
  await prisma.organization.create({
    data: {
      name: "Acne Inc",
      created_by_user_id: supabase.auth.user()!.id,
      projects: {
        create: {
          name: "dev-project",
          default_iso_code: "en",
          languages: {
            createMany: { data: [{ iso_code: "en" }, { iso_code: "de" }] },
          },
        },
      },
    },
  });
  await signOutUser();
  await signUpMockUser(mockUser2);
  await prisma.organization.create({
    data: {
      name: "Bass Co.",
      created_by_user_id: supabase.auth.user()!.id,
      projects: {
        create: {
          name: "bass-project",
          default_iso_code: "en",
          languages: {
            createMany: { data: [{ iso_code: "en" }, { iso_code: "fr" }] },
          },
        },
      },
    },
  });
  await prisma.organization.create({
    data: {
      name: "Color AS",
      created_by_user_id: supabase.auth.user()!.id,
      projects: {
        create: {
          name: "color-project",
          default_iso_code: "en",
          languages: {
            createMany: { data: [{ iso_code: "en" }, { iso_code: "de" }] },
          },
        },
      },
    },
  });
  const organization = await prisma.organization.findFirst({
    where: {
      name: "Color AS",
    },
  });
  const user = await prisma.user.findFirst({
    where: {
      email: mockUser.email,
    },
  });
  await prisma.member.create({
    data: {
      user_id: user!.id,
      organization_id: organization!.id,
      role: member_role.TRANSLATOR,
    },
  });
  console.log("✅ applied seeds");
  console.log(`➡️ Mock user 1 email: ${mockUser.email}`);
  console.log(`➡️ Mock user 1 password: ${mockUser.password}`);
  console.log(`➡️ Mock user 2 email: ${mockUser2.email}`);
  console.log(`➡️ Mock user 2 password: ${mockUser2.password}`);
}

main().catch((e) => console.error(e));
