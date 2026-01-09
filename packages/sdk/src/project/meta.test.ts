import { describe, expect, test } from "vitest";
import { compareSemver, pickHighestVersion } from "./meta.js";

describe("compareSemver", () => {
	test("orders prerelease identifiers by numeric value", () => {
		expect(compareSemver("2.5.0-next.1", "2.5.0-next.2")).toBeLessThan(0);
		expect(compareSemver("2.5.0-next.2", "2.5.0-next.10")).toBeLessThan(0);
	});

	test("treats prerelease as lower than stable", () => {
		expect(compareSemver("2.5.0-next.2", "2.5.0")).toBeLessThan(0);
		expect(compareSemver("2.5.0", "2.5.0-next.2")).toBeGreaterThan(0);
	});
});

describe("pickHighestVersion", () => {
	test("prefers the newest prerelease", () => {
		expect(pickHighestVersion(["2.5.0-next.1", "2.5.0-next.2"])).toBe(
			"2.5.0-next.2"
		);
	});

	test("prefers stable over prerelease", () => {
		expect(pickHighestVersion(["2.5.0-next.2", "2.5.0"])).toBe("2.5.0");
	});
});
