import { supabase } from "../../local.config";
import { definitions } from "../../types/definitions";

describe("row level security is activated", () => {
  test("on key table", async () => {
    const key = await supabase.from<definitions["key"]>("key").select("*");
    expect(key.data?.length).toEqual(0);
  });
});
