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

describe("policies/project", () => {
  test("Member can select projects", async () => {
    const projects = await supabase
      .from<definitions["project"]>("project")
      .select();
    expect(projects.data?.length).toBeGreaterThanOrEqual(2);
  });
  test("User can not select projects which they are not memeber of", async () => {
    const projects = await supabase
      .from<definitions["project"]>("project")
      .select()
      .match({
        name: "bass-project",
      });
    expect(projects.data?.length).toEqual(0);
  });
  test("User can create a project ", async () => {
    const uid = supabase.auth.user()!.id;
    const project_insert = await supabase
      .from<definitions["project"]>("project")
      .insert(
        {
          name: "new-project",
          created_by_user_id: uid,
          default_iso_code: "en",
        },
        { returning: "minimal" }
      );
    expect(project_insert.error).toEqual(null);
    const projects = await supabase
      .from<definitions["project"]>("project")
      .select()
      .match({
        name: "new-project",
      });
    expect(projects.data?.some((p) => p.name === "new-project")).toEqual(true);
  });
  // test("User can delete a project which they are a member of", async () => {
  //   const deletion = await supabase
  //     .from<definitions["project"]>("project")
  //     .delete()
  //     .match({
  //       name: "new-project",
  //     });
  //   expect(deletion.error).toBe(null);
  //   const projects = await supabase
  //     .from<definitions["project"]>("project")
  //     .select()
  //     .match({
  //       name: "new-project",
  //     });
  //   expect(projects.data!.length).toEqual(0);
  // });
});
