import { Console } from "console";
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

describe("policies/translation", () => {
    test("Anyone can select translation", async () => {
        await supabase.auth.signOut();
        const translations = await supabase.from<definitions["translation"]>("translation")
            .select();
        expect(translations.data!.length).toBeGreaterThan(0);
    });
    test("Member can delete translation", async () => {
        const project = await supabase.from<definitions["project"]>("project")
            .select()
            .match({
                name: "dev-project"
        });
        const translation_delete = await supabase.from<definitions["translation"]>("translation")
            .delete()
            .match({
                key_name: "button.confirm",
                project_id: project.data![0].id,
                iso_code: "en"
        })
        const translations = await supabase.from<definitions["translation"]>("translation")
            .select()
            .match({
                key_name: "button.confirm",
                project_id: project.data![0].id,
                iso_code: "en"
        })
        expect(translations.data!.length).toEqual(0);
    });
    test("Member can upsert translation", async () => {
        const project = await supabase.from<definitions["project"]>("project")
            .select()
            .match({
                name: "dev-project"
        });
        const translation_upsert = await supabase.from<definitions["translation"]>("translation")
            .upsert({
                key_name: "button.confirm",
                project_id: project.data![0].id,
                iso_code: "en",
                is_reviewed: true,
                text: "Confirm"
        });
        const translation = await supabase.from<definitions["translation"]>("translation")
        .select()
        .match({
            key_name: "button.confirm",
            project_id: project.data![0].id,
            iso_code: "en"
        });
        console.log("!!! RESPONSE !!!");
        console.log(translation.error);
        console.log(translation.statusText);
        expect(translation.data?.length).toEqual(1);
    })
});
