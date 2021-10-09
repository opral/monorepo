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

describe("policies/project", () => {
  test("Member can select projects", async () => {
    const projects = await supabase.from<definitions["project"]>("project").select();
    expect(projects.data?.length).toBeGreaterThanOrEqual(2);
  });
  test("User can not select projects which they are not memeber of", async () => {
    const projects = await supabase.from<definitions["project"]>("project")
      .select()
      .match({
        name: "bass-project"
      });
    expect(projects.data?.length).toEqual(0)
  });
  test("User can create a project for an organization which they are admin of", async () => {
    let organization_id;
    const organization = await supabase.from<definitions["organization"]>("organization")
      .select("id")
      .match({
        name: "Acne Inc"
      });
    const organization_insert = await supabase.from<definitions["project"]>("project")
      .upsert({
        name: "new-project",
        organization_id: organization.data![0].id,
        api_key: "2f066a3e-038b-4a02-8449-63976cf4b12a",
        default_iso_code: "en",
        
      });
    const projects = await supabase.from<definitions["project"]>("project")
      .select()
      .match({
        name: "new-project"
      });
      expect(projects.data!.length).toEqual(1);
  });
  test("User can delete a project from an organization which thay are admin of", async () => {
    await supabase.from<definitions["project"]>("project")
      .delete()
      .match({
        name: "new-project"
      });
    const projects = await supabase.from<definitions["project"]>("project")
      .select()
      .match({
        name: "new-project"
      });
    expect(projects.data!.length).toEqual(0);
  });
  test("User cannot upsert a project for an organizatoin which they are not admin of", async () => {
    let organization_id;
    const organization = await supabase.from<definitions["organization"]>("organization")
      .select("id")
      .match({
        name: "Color AS"
      });
    const organization_insert = await supabase.from<definitions["project"]>("project")
      .upsert({
        name: "invalid-project",
        organization_id: organization.data![0].id,
        api_key: "cea34fb5-5b49-44a2-92b5-5d5d6f2ba348",
        default_iso_code: "en",
        
      });
    const projects = await supabase.from<definitions["project"]>("project")
      .select()
      .match({
        name: "invalid-project"
      });
      expect(projects.data!.length).toEqual(0);
  });
  test("User cannot delete a project for an organization which they are not admin of", async () => {
    await supabase.from<definitions["project"]>("project")
      .delete()
      .match({
        name: "color-project"
      });
    const projects = await supabase.from<definitions["project"]>("project")
      .select()
      .match({
        name: "color-project"
      });
      expect(projects.data!.length).toEqual(1);
  });
})
