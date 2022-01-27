import { mockUser, mockUser2, anonSupabaseClient } from "../../local.config";
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

describe("policies/project_member", () => {
  test("Member can select coworkers", async () => {
    const members = await anonSupabaseClient
      .from<definitions["project_member"]>("project_member")
      .select();
    if (members.error) console.error(members.error.message);
    expect(members.data?.length).toEqual(3);
  });
  test("Project member can add new member to the project", async () => {
    const user32 = anonSupabaseClient.auth.user()?.id;
    const project = await anonSupabaseClient
      .from<definitions["project"]>("project")
      .select()
      .match({
        name: "dev-project",
      });
    const user = await anonSupabaseClient
      .from<definitions["user"]>("user")
      .select()
      .match({
        email: mockUser2.email,
      });
    const insert = await anonSupabaseClient
      .from<definitions["project_member"]>("project_member")
      .insert({
        user_id: user.data![0].id,
        project_id: project.data![0].id,
      });
    const member = await anonSupabaseClient
      .from<definitions["project_member"]>("project_member")
      .select()
      .match({
        user_id: user.data![0].id,
        project_id: project.data![0].id,
      });
    expect(member.data?.length).toEqual(1);
  });
  test("Project member can delete member of project", async () => {
    const project = await anonSupabaseClient
      .from<definitions["project"]>("project")
      .select()
      .match({
        name: "dev-project",
      });
    const user = await anonSupabaseClient
      .from<definitions["user"]>("user")
      .select()
      .match({
        email: mockUser2.email,
      });
    await anonSupabaseClient
      .from<definitions["project_member"]>("project_member")
      .delete()
      .match({
        user_id: user.data![0].id,
        project_id: project.data![0].id,
      });
    const member = await anonSupabaseClient
      .from<definitions["project_member"]>("project_member")
      .select()
      .match({
        user_id: user.data![0].id,
        project_id: project.data![0].id,
      });
    expect(member.data?.length).toEqual(0);
  });
});
