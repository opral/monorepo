import { mockUser, supabase } from "../../local.config";
import { definitions } from "../../types/definitions";

beforeAll(async () => {
  // The user needs to be authorized for the requests.
  // If this login fails, does the user exists in the seeding file?
  const login = await supabase.auth.signIn({
    email: mockUser.email,
    password: mockUser.password,
  });
  if (login.error) {
    throw login.error;
  }
  expect(login.user.email).toEqual(mockUser.email);
});

// all tests expect data as given in the seed.
test("auth: select case", async () => {
  const response = await supabase.from<definitions["project"]>("project").select("*");
  if (response.error) {
    throw response.error;
  }
  expect(response.data?.length).toEqual(1);
});
