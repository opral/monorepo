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
  test("User can create a project for an organization which they are admin of", async () => {
    let organization_id;
    const organization = await supabase
      .from<definitions["organization"]>("organization")
      .select("id")
      .match({
        name: "Acne Inc",
      });
    const project_insert = await supabase
      .from<definitions["project"]>("project")
      .upsert(
        {
          name: "new-project",
          organization_id: organization.data![0].id,
          default_iso_code: "en",
        },
        { onConflict: "id" }
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
  test("User can delete a project from an organization which thay are admin of", async () => {
    await supabase.from<definitions["project"]>("project").delete().match({
      name: "new-project",
    });
    const projects = await supabase
      .from<definitions["project"]>("project")
      .select()
      .match({
        name: "new-project",
      });
    expect(projects.data!.length).toEqual(0);
  });
  test("User cannot upsert a project for an organizatoin which they are not admin of", async () => {
    let organization_id;
    const organization = await supabase
      .from<definitions["organization"]>("organization")
      .select("id")
      .match({
        name: "Color AS",
      });
    const organization_insert = await supabase
      .from<definitions["project"]>("project")
      .upsert({
        name: "invalid-project",
        organization_id: organization.data![0].id,
        default_iso_code: "en",
      });
    const projects = await supabase
      .from<definitions["project"]>("project")
      .select()
      .match({
        name: "invalid-project",
      });
    expect(projects.data!.length).toEqual(0);
  });
  test("User cannot delete a project for an organization which they are not admin of", async () => {
    await supabase.from<definitions["project"]>("project").delete().match({
      name: "color-project",
    });
    const projects = await supabase
      .from<definitions["project"]>("project")
      .select()
      .match({
        name: "color-project",
      });
    expect(projects.data!.length).toEqual(1);
  });
});
