import { describe, test, expect, vi } from "vitest"
import { getEnvVar } from "./getEnv.js"

describe("getEnvVar", () => {
	test("should fail on an env var not available but required", () => {
		expect(() => getEnvVar("I_DON_T_EXIST")).toThrowError("I_DON_T_EXIST")
	})

	test("should return the default value if it doesnt exist", () => {
		expect(getEnvVar("I_DON_T_EXIST", { default: "DEFAULT" })).toBe("DEFAULT")
	})

	test("should return env var", () => {
		vi.stubEnv("EXISTING_ENV_VAR", "TEST")
		expect(getEnvVar("EXISTING_ENV_VAR", { default: "DEFAULT" })).toBe("TEST")
	})
})
