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
    test("Member can only select themself", async () => {
        const user = await supabase.from<definitions["user"]>("user")
          .select();
        const members = await supabase.from<definitions["member"]>("member")
            .select();
        let invalid = 0;
        members.data!.forEach(m => {
          if (m.user_id !== user.data![0].id) {
            invalid++;
          }
        });
        expect(invalid).toEqual(0); 
    })
})
