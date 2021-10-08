import { mockUser, supabase } from "../../local.config";
import { definitions } from "../../types/definitions";

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

describe("policies/key", () => {
  test("Member can select key", async () => {
    const project = await supabase.from<definitions["project"]>("project")
      .select()
      .match({
        name: "dev-project"
      });
    const keys = await supabase.from<definitions["key"]>("key")
    .select()
    .match({
      project_id: project.data![0].id
    });
    expect(keys.data?.length).toBeGreaterThanOrEqual(1);
  });
  test("User can not select keys from projects which they are not memebers of", async () => {
    const keys = await supabase.from<definitions["key"]>("key")
      .select("project_id");
    let illegalKeys = 0;
    keys.data!.forEach(async id => {
      let project = await supabase.from<definitions["project"]>("project")
        .select();
      project.data!.length === 0 ? illegalKeys++ : null;
    });
    expect(illegalKeys).toEqual(0);
  });
  test("Admin can upsert key", async () => {
    const projects = await supabase.from<definitions["project"]>("project")
      .select()
      .match({ 
        name: "dev-project"
      });
    const upsertCreate = await supabase.from<definitions["key"]>("key")
      .upsert({
        project_id: projects.data![0].id,
        name: "test.test"
      })
    const keys = await supabase.from<definitions["key"]>("key")
      .select()
      .match({
        name: "test.test"
      });
    expect(keys.data!.length).toEqual(1);
  });
  test("Admin can delete key", async () => {
    const deleteKey = await supabase.from<definitions["key"]>("key")
      .delete()
      .match({
        name: "test.test"
      });
    const keys = await supabase.from<definitions["key"]>("key")
      .select()
      .match({
        name: "test.test"
      })
    expect(keys.data!.length).toEqual(0);
  });
  test("Non admin member can not upsert key", async () => {
    const projects = await supabase.from<definitions["project"]>("project")
      .select()
      .match({ 
        name: "color-project"
      });
    const upsertCreate = await supabase.from<definitions["key"]>("key")
      .upsert({
        project_id: projects.data![0].id,
        name: "test.test"
      })
    const keys = await supabase.from<definitions["key"]>("key")
      .select()
      .match({
        name: "test.test"
      });
    expect(keys.data!.length).toEqual(0);
  });
  test("Non admin can delete key", async () => {
    const projects = await supabase.from<definitions["project"]>("project")
      .select()
      .match({ 
        name: "color-project"
      });
    const deleteKey = await supabase.from<definitions["key"]>("key")
      .delete()
      .match({
        project_id: projects.data![0].id,
        name: "example.hello"
      });
    const keys = await supabase.from<definitions["key"]>("key")
      .select()
      .match({
        project_id: projects.data![0].id,
        name: "example.hello"
      })
    expect(keys.data!.length).toEqual(1);
  });
});
