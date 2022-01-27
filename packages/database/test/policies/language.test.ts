import { mockUser, anonSupabaseClient } from "../../local.config";
import { definitions } from "../../src/types/definitions";

beforeEach(async () => {
  // The user needs to be authorized for the requests.
  // If this login fails, does the user exists in the seeding file?
  const login = await anonSupabaseClient.auth.signIn({
    email: mockUser.email,
    password: mockUser.password,
  });
  if (login.error) {
    throw login.error;
  }
  expect(login.user?.email).toEqual(mockUser.email);
});

describe("policies/language", () => {
  test("Member can select language", async () => {
    const langauges = await anonSupabaseClient
      .from<definitions["language"]>("language")
      .select();
    expect(langauges.data?.length).toBeGreaterThan(0);
  });
  test("Member can create language", async () => {
    const project = await anonSupabaseClient
      .from<definitions["project"]>("project")
      .select()
      .match({
        name: "color-project",
      });
    if (project.error || project.data === null) {
      console.error(project.error);
      fail();
    }
    const languageUpsert = await anonSupabaseClient
      .from<definitions["language"]>("language")
      .upsert({
        code: "fr",
        project_id: project.data![0].id,
      });
    const languages = await anonSupabaseClient
      .from<definitions["language"]>("language")
      .select()
      .match({
        code: "fr",
        project_id: project.data![0].id,
      });
    expect(languages.data!.length).toEqual(1);
  });
  test("Member can delete language", async () => {
    const project = await anonSupabaseClient
      .from<definitions["project"]>("project")
      .select()
      .match({
        name: "color-project",
      });
    const langauge_delete = await anonSupabaseClient
      .from<definitions["language"]>("language")
      .delete()
      .match({
        code: "de",
        project_id: project.data![0].id,
      });
    const languages = await anonSupabaseClient
      .from<definitions["language"]>("language")
      .select()
      .match({
        code: "de",
        project_id: project.data![0].id,
      });
    expect(languages.data!.length).toEqual(0);
  });
});
