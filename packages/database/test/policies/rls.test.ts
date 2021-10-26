import { supabase } from "../../local.config";
import { definitions } from "../../types/definitions";

describe("row level security is activated", () => {
  test("on user table", async () => {
    const users = await supabase.from<definitions["user"]>("user").select();
    expect(users.status).toEqual(401);
  });
  test("on organization table", async () => {
    const organizations = await supabase
      .from<definitions["organization"]>("organization")
      .select();
    expect(organizations.status).toEqual(401);
  });
  test("on project table", async () => {
    const projects = await supabase
      .from<definitions["project"]>("project")
      .select();
    expect(projects.status).toEqual(401);
  });
  test("on language table", async () => {
    const languages = await supabase
      .from<definitions["language"]>("language")
      .select();
    expect(languages.status).toEqual(401);
  });
  test("on key table", async () => {
    const keys = await supabase.from<definitions["key"]>("key").select();
    expect(keys.status).toEqual(401);
  });
  test("on translation table", async () => {
    const translations = await supabase
      .from<definitions["translation"]>("translation")
      .select();
    expect(translations.status).toEqual(401);
  });
  test("on member table", async () => {
    const members = await supabase
      .from<definitions["member"]>("member")
      .select();
    expect(members.status).toEqual(401);
  });
});
