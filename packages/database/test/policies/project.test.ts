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

describe("policies/projectAdmin", () => {
  test("Admin can act on project", async () => {
    const projects = await supabase.from<definitions["project"]>("project").select();
    expect(projects.data?.length).toBeGreaterThanOrEqual(1);
  })
})
