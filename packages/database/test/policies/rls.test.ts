import { supabase } from "../../local.config";
import { definitions } from "../../src/types/definitions";

describe("row level security is activated", () => {
  test("on user table", async () => {
    const users = await supabase.from<definitions["user"]>("user").select();
    expect(users.data?.length).toEqual(0);
  });

  test("on project table", async () => {
    const projects = await supabase
      .from<definitions["project"]>("project")
      .select();
    expect(projects.data?.length).toEqual(0);
  });
  test("on project_member table", async () => {
    const projects = await supabase
      .from<definitions["project"]>("project")
      .select();
    expect(projects.data?.length).toEqual(0);
  });
  test("on language table", async () => {
    const languages = await supabase
      .from<definitions["language"]>("language")
      .select();
    expect(languages.data?.length).toEqual(0);
  });
});
