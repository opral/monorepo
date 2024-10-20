import { describe, expect, it } from "vitest";
import { isSnakeCase } from "./isSnakeCase.js"; // Update with your actual file name

describe("isSnakeCase function", () => {
  it("returns true for a valid snake_case string", () => {
    expect(isSnakeCase("hello_world")).toBe(true);
  });

  it("returns false for a string starting with an uppercase letter", () => {
    expect(isSnakeCase("Hello_world")).toBe(false);
  });

  // Add more test cases to cover different scenarios

  // For example:
  it("returns false for consecutive underscores", () => {
    expect(isSnakeCase("hello__world")).toBe(false);
  });

  it("returns false for a string ending with an underscore", () => {
    expect(isSnakeCase("hello_world_")).toBe(false);
  });

  it("returns false for a string starting with an underscore", () => {
    expect(isSnakeCase("_hello_world")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isSnakeCase("")).toBe(false);
  });

  it("returns false for undefined", () => {
    // @ts-expect-error
    expect(isSnakeCase(undefined)).toBe(false);
  });
});
