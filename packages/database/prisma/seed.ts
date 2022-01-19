import { PrismaClient } from "@prisma/client";
import { supabase, mockUser, mockUser2, MockUser } from "../local.config";

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
  await prisma.project.create({
    data: {
      name: "dev-project",
      created_by_user_id: supabase.auth.user()!.id,
      default_iso_code: "en",
      languages: {
        createMany: { data: [{ iso_code: "en" }, { iso_code: "de" }] },
      },
    },
  });
  await signOutUser();
  await signUpMockUser(mockUser2);
  await prisma.project.create({
    data: {
      name: "bass-project",
      created_by_user_id: supabase.auth.user()!.id,
      default_iso_code: "en",
      languages: {
        createMany: { data: [{ iso_code: "en" }, { iso_code: "fr" }] },
      },
    },
  });
  await prisma.project.create({
    data: {
      created_by_user_id: supabase.auth.user()!.id,
      name: "color-project",
      default_iso_code: "en",
      languages: {
        createMany: { data: [{ iso_code: "en" }, { iso_code: "de" }] },
      },
    },
  });
  const project = await prisma.project.findFirst({
    where: {
      name: "color-project",
    },
  });
  const user = await prisma.user.findFirst({
    where: {
      email: mockUser.email,
    },
  });
  await prisma.project_member.create({
    data: {
      user_id: user!.id,
      project_id: project!.id,
    },
  });
  console.log("✅ applied seeds");
  console.log(`➡️ Mock user 1 email: ${mockUser.email}`);
  console.log(`➡️ Mock user 1 password: ${mockUser.password}`);
  console.log(`➡️ Mock user 2 email: ${mockUser2.email}`);
  console.log(`➡️ Mock user 2 password: ${mockUser2.password}`);
}

main().catch((e) => console.error(e));
