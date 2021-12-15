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

describe("policies/organization", () => {
  test("User can select on organizations they are member of", async () => {
    const organizations = await supabase
      .from<definitions["organization"]>("organization")
      .select();
    expect(organizations.data?.length).toEqual(2);
  });
  test("User can create new organization", async () => {
    await supabase.from<definitions["organization"]>("organization").insert(
      {
        name: "inlang",
        created_by_user_id: supabase.auth.user()!.id,
      },
      {
        returning: "minimal",
      }
    );
    const organization = await supabase
      .from<definitions["organization"]>("organization")
      .select()
      .match({
        name: "inlang",
      });
    expect(organization.data?.length).toEqual(1);
  });
  test("Owner can delete organization", async () => {
    await supabase
      .from<definitions["organization"]>("organization")
      .delete()
      .match({ name: "inlang", created_by_user_id: supabase.auth.user()!.id });
    const organization = await supabase
      .from<definitions["organization"]>("organization")
      .select()
      .match({
        name: "inlang",
      });
    expect(organization.data?.length).toEqual(0);
  });
  test("User can't select from organization which they are not a member of", async () => {
    const organization = await supabase
      .from<definitions["organization"]>("organization")
      .select()
      .match({ name: "Bass Co." });
    expect(organization.data?.length).toEqual(0);
  });
  test("Member can't delete organization which they are not owner of", async () => {
    await supabase
      .from<definitions["organization"]>("organization")
      .delete()
      .match({ name: "Color AS" });
    const organization = await supabase
      .from<definitions["organization"]>("organization")
      .select()
      .match({ name: "Color AS" });
    expect(organization.data?.length).toEqual(1);
  });
});
