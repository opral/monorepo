import { test, expect } from "vitest";
import { inputsType, jsDocBundleFunctionTypes } from "./jsdoc-types.js";
import type { InputVariable } from "@inlang/sdk";

test("inputsType generates unique parameter types even when the same input appears multiple times", () => {
	// Simulate a case where the same input appears multiple times (like in a translation with placeholders)
	const inputs: InputVariable[] = [
		{ name: "days", type: "input-variable" },
		{ name: "days", type: "input-variable" }, // Duplicated input
	];

	// The generated input type should only include each parameter once
	const result = inputsType(inputs);
	expect(result).toBe("{ days: NonNullable<unknown> }");

	// It should not generate a duplicate parameter
	expect(result).not.toBe(
		"{ days: NonNullable<unknown>, days: NonNullable<unknown> }"
	);
});

test("jsDocBundleFunctionTypes correctly handles messages with duplicate inputs", () => {
	const inputs: InputVariable[] = [
		{ name: "days", type: "input-variable" },
		{ name: "days", type: "input-variable" }, // Duplicated input
	];

	const locales = ["en-us", "de-de"];

	const result = jsDocBundleFunctionTypes({ inputs, locales });

	// The JSDoc should only include each parameter once
	expect(result).toContain("@param {{ days: NonNullable<unknown> }} inputs");

	// It should not contain duplicated parameters
	expect(result).not.toContain(
		"@param {{ days: NonNullable<unknown>, days: NonNullable<unknown> }} inputs"
	);
});
