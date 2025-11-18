import { expect, test } from "vitest";
import { JSONPointerValueSchema } from "./json-pointer-value.js";

test("JSONPointerValueSchema declares path as the primary key", () => {
	expect(JSONPointerValueSchema["x-lix-primary-key"]).toEqual(["/path"]);
});
