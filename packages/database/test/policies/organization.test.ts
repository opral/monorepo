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

describe("policies/organization", () => {
  test("User can select on own organization", async () => {
    const organizations = await supabase.from<definitions["organization"]>("organization").select();
    expect(organizations.data?.length).toBeGreaterThanOrEqual(1);
  });
  test("User can create new organization", async () => {
    const organization = await supabase.from<definitions["organization"]>("organization")
      .insert({
        name: "inlang", 
        created_by_user_id: supabase.auth.user()!.id
      },
      { 
        returning: "minimal"
      });
      expect(organization.status).toEqual(201);
  });
  test("Owner can delete organization", async () => {
    const organization = await supabase.from<definitions["organization"]>("organization")
      .delete()
      .match({name: "inlang", created_by_user_id: supabase.auth.user()!.id});
      expect(organization.status).toEqual(200);
  });
})
