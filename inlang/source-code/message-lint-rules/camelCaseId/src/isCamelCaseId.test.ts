import { isCamelCaseId } from "./isCamelCaseId.js";
import { describe, it, expect } from "vitest";

describe("isCamelCaseId", () => {
  // Test case: valid camelCase identifiers
  it("should return true for valid camelCase identifiers", () => {
    expect(isCamelCaseId("myVariable")).toBe(true);
    expect(isCamelCaseId("anotherVariable")).toBe(true);
    expect(isCamelCaseId("mixedCaseIdentifier")).toBe(true);
    expect(isCamelCaseId("a11yCamelCase")).toBe(true);
    expect(isCamelCaseId("contactBudget10k")).toBe(true);
  });

  // Test case: invalid camelCase identifiers
  it("should return false for invalid camelCase identifiers", () => {
    expect(isCamelCaseId("Invalid Identifier")).toBe(false); // contains space
    expect(isCamelCaseId("123Variable")).toBe(false); // starts with a number
    expect(isCamelCaseId("special-Variable")).toBe(false); // contains special character
    expect(isCamelCaseId("snake_case")).toBe(false); // not camelCase
    expect(isCamelCaseId("PascalCase")).toBe(false); // not camelCase
    expect(isCamelCaseId("kebab-case")).toBe(false); // not camelCase
    expect(isCamelCaseId("homeCTASubtitle")).toBe(false); // contains multiple uppercase letters
    expect(isCamelCaseId("homeSubtitleCTA")).toBe(false); // contains multiple uppercase letters
  });

  // Test case: edge cases
  it("should return false for empty string", () => {
    expect(isCamelCaseId("")).toBe(false);
  });

  it("should return true for single lowercase letter", () => {
    expect(isCamelCaseId("a")).toBe(true);
  });

  it("should return false for single uppercase letter", () => {
    expect(isCamelCaseId("A")).toBe(false);
  });

  it("should return true for two concatenated valid camelCase identifiers", () => {
    expect(isCamelCaseId("firstIdentifierSecondIdentifier")).toBe(true);
  });
});
