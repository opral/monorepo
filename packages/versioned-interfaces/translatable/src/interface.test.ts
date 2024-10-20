import { Translatable } from "./interface.js";
import { it, expect } from "vitest";
import { Value } from "@sinclair/typebox/value";
import { Type } from "@sinclair/typebox";

it("should be valid to use only the Type", () => {
  const translatable: Translatable<string> = "Hello world";
  const isValid = Value.Check(Translatable(Type.String()), translatable);
  expect(isValid).toBe(true);
});

it("should be valid to use the type in a translatable object", () => {
  const translatable: Translatable<string> = {
    en: "Hello world",
    de: "Hallo Welt",
  };
  const isValid = Value.Check(Translatable(Type.String()), translatable);
  expect(isValid).toBe(true);
});
