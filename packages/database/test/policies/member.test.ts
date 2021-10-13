import { mockUser, mockUser2, supabase } from "../../local.config";
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
        expect(members.data?.length).toEqual(3); 
    });
    test("Admin can create new member of their oganization", async () => {
		const organization = await supabase.from<definitions["organization"]>("organization")
			.select()
			.match({
				name: "Acne Inc"
			});
		const user = await supabase.from<definitions["user"]>("user")
			.select()
			.match({
				email: mockUser2.email
			});
		await supabase.from<definitions["member"]>("member")
			.insert({
				user_id: user.data![0].id,
				organization_id: organization.data![0].id,
				role: "TRANSLATOR"
			});
		const member = await supabase.from<definitions["member"]>("member")
			.select()
			.match({
				user_id: user.data![0].id,
				organization_id: organization.data![0].id,
				role: "TRANSLATOR"
			});
			expect(member.data?.length).toEqual(1);
	});
	test("Admin can delete member of their organization", async () => {
		const organization = await supabase.from<definitions["organization"]>("organization")
			.select()
			.match({
				name: "Acne Inc"
			});
		const user = await supabase.from<definitions["user"]>("user")
			.select()
			.match({
				email: mockUser2.email
			});
		await supabase.from<definitions["member"]>("member")
			.delete()
			.match({
				user_id: user.data![0].id,
				organization_id: organization.data![0].id,
				role: "TRANSLATOR"
			});
		const member = await supabase.from<definitions["member"]>("member")
			.select()
			.match({
				user_id: user.data![0].id,
				organization_id: user.data![0].id,
			});
		expect(member.data?.length).toEqual(0)
	})
    test("Translator can not delete member of organization", async () => {
		const organization = await supabase.from<definitions["organization"]>("organization")
			.select()
			.match({
				name: "Color AS"
			});
		const user = await supabase.from<definitions["user"]>("user")
			.select()
			.match({
				email: mockUser2.email
			});
		await supabase.from<definitions["member"]>("member")
			.delete()
			.match({
				user_id: user.data![0].id,
				organization_id: organization.data![0].id,
			});
		const member = await supabase.from<definitions["member"]>("member")
			.select()
			.match({
				user_id: user.data![0].id,
				organization_id: organization.data![0].id,
			});
		expect(member.data?.length).toEqual(1)
    })
})
