import { mockUser, supabase } from "../../local.config";
import { definitions } from "../../src/types/definitions";

beforeEach(async () => {
  // The user needs to be authorized for the requests.
  // If this login fails, does the user exists in the seeding file?
  const login = await supabase.auth.signIn({
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
    const langauges = await supabase
      .from<definitions["language"]>("language")
      .select();
    expect(langauges.data?.length).toBeGreaterThan(0);
  });
  test("Member can not upsert language", async () => {
    const project = await supabase
      .from<definitions["project"]>("project")
      .select()
      .match({
        name: "color-project",
      });
    const langauge_upsert = await supabase
      .from<definitions["language"]>("language")
      .upsert({
        iso_code: "fr",
        project_id: project.data![0].id,
      });
    const languages = await supabase
      .from<definitions["language"]>("language")
      .select()
      .match({
        iso_code: "fr",
        project_id: project.data![0].id,
      });
    expect(languages.data!.length).toEqual(0);
  });
  test("Member can not delete language", async () => {
    const project = await supabase
      .from<definitions["project"]>("project")
      .select()
      .match({
        name: "color-project",
      });
    const langauge_delete = await supabase
      .from<definitions["language"]>("language")
      .delete()
      .match({
        iso_code: "de",
        project_id: project.data![0].id,
      });
    const languages = await supabase
      .from<definitions["language"]>("language")
      .select()
      .match({
        iso_code: "de",
        project_id: project.data![0].id,
      });
    expect(languages.data!.length).toEqual(1);
  });
  test("Admin can upsert language", async () => {
    const project = await supabase
      .from<definitions["project"]>("project")
      .select()
      .match({
        name: "dev-project",
      });
    const langauge_upsert = await supabase
      .from<definitions["language"]>("language")
      .upsert({
        iso_code: "fr",
        project_id: project.data![0].id,
      });
    const languages = await supabase
      .from<definitions["language"]>("language")
      .select()
      .match({
        iso_code: "fr",
        project_id: project.data![0].id,
      });
    expect(languages.data!.length).toEqual(1);
  });
  test("Admin can delete language", async () => {
    const project = await supabase
      .from<definitions["project"]>("project")
      .select()
      .match({
        name: "dev-project",
      });
    const langauge_delete = await supabase
      .from<definitions["language"]>("language")
      .delete()
      .match({
        iso_code: "fr",
        project_id: project.data![0].id,
      });
    const languages = await supabase
      .from<definitions["language"]>("language")
      .select()
      .match({
        iso_code: "fr",
        project_id: project.data![0].id,
      });
    expect(languages.data!.length).toEqual(0);
  });
});
