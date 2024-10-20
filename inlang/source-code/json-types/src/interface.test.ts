import { Value } from "@sinclair/typebox/value";
import { JSONObject } from "./interface.js";
import { it, expect } from "vitest";

it("should enforce an object as value", () => {
  // @ts-expect-error - Value is not an object
  const invalid: JSONObject = "hello";
  const valid: JSONObject = {};
  expect(Value.Check(JSONObject, invalid)).toBe(false);
  expect(Value.Check(JSONObject, valid)).toBe(true);
});

it("should be possible to have one nested object layer", () => {
  const mockJson: JSONObject = {
    "plugin.x.y": {},
  };
  expect(Value.Check(JSONObject, mockJson)).toBe(true);
});

// from https://github.com/opral/monorepo/pull/1142#discussion_r1300055458
it("should allow objects in arrays", () => {
  const mockJson: JSONObject = {
    languageNegotiation: {
      strategies: [
        {
          type: "url",
        },
      ],
    },
  };
  expect(Value.Check(JSONObject, mockJson)).toBe(true);
});
