import {
  anonSupabaseClient,
  serviceSupabaseClient,
  mockUser,
  mockUser2,
} from "./local.config.js";

// Not typescript because ts-node doesnt work properly.
//
// If you update the database schema, make sure you update the seeds.

/**
 * Creates a mock user if the user does not exist yet.
 *
 * @returns userId
 */
async function signUpMockUser(user) {
  // fails silenently if user exists already -> does not matter
  await anonSupabaseClient.auth.signUp({
    email: user.email,
    password: user.password,
  });
  const signIn = await anonSupabaseClient.auth.signIn({
    email: user.email,
    password: user.password,
  });
  if (signIn.error || signIn.user === null) {
    console.error(signIn.error);
    throw signIn.error ?? "user is null";
  }
  const signOut = await anonSupabaseClient.auth.signOut();
  if (signOut.error) {
    console.log(signOut.error.message);
    throw signOut.error;
  }
  return signIn.user.id;
}

async function main() {
  console.log("applying seeds...");
  const user1 = await signUpMockUser(mockUser);
  const user2 = await signUpMockUser(mockUser2);
  const insertProjects = await serviceSupabaseClient.from("project").insert([
    {
      name: "dev-project",
      created_by_user_id: user1,
      base_language_code: "en",
    },
    {
      name: "bass-project",
      created_by_user_id: user2,
      base_language_code: "en",
    },
    {
      name: "color-project",
      created_by_user_id: user2,
      base_language_code: "en",
    },
  ]);
  if (insertProjects.error || insertProjects.data === null) {
    throw insertProjects.error;
  }
  const insertLanguages = await serviceSupabaseClient.from("language").insert([
    { code: "en", project_id: insertProjects.data[0].id },
    { code: "de", project_id: insertProjects.data[0].id },
    { code: "en", project_id: insertProjects.data[1].id },
    { code: "fr", project_id: insertProjects.data[1].id },
    { code: "en", project_id: insertProjects.data[2].id },
    { code: "de", project_id: insertProjects.data[2].id },
  ]);
  if (insertLanguages.error || insertLanguages.data === null) {
    throw insertLanguages.error;
  }
  // have user1 be a member of a project from user2
  const insertProjectMemberships = await serviceSupabaseClient
    .from("project_member")
    .insert({
      project_id: insertProjects.data[2].id,
      user_id: user1,
    });
  if (
    insertProjectMemberships.error ||
    insertProjectMemberships.data === null
  ) {
    throw insertProjectMemberships.error;
  }
  console.log("✅ applied seeds");
  console.log(`➡️ Mock user 1 email: ${mockUser.email}`);
  console.log(`➡️ Mock user 1 password: ${mockUser.password}`);
  console.log(`➡️ Mock user 2 email: ${mockUser2.email}`);
  console.log(`➡️ Mock user 2 password: ${mockUser2.password}`);
}

main().catch((e) => console.error(e));
