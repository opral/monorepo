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
console.log("uid: " + supabase.auth.user());
describe("policies/organization", () => {
  test("User can slecect on organization table", async () => {
    const organizations = await supabase.from<definitions["organization"]>("organization").select();
    expect(organizations.data?.length).toBeGreaterThanOrEqual(1);
  })
})
