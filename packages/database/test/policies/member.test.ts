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

describe("policies/member", () => {
    test("Member can select coworkers", async () => {
        const members = await supabase.from<definitions["member"]>("member")
            .select();
        if (members.error) console.error(members.error.message);
        console.log(members)
        expect(members.data?.length).toEqual(3); 
    })
})
