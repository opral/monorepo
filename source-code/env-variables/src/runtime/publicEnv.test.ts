import { it, expect } from "vitest"
import { publicEnv } from "./publicEnv.js"

// The build step defines PUBLIC_ENV_DEFINED_IN_BUILD_STEP
it("should not throw if PUBLIC_ENV_DEFINED_IN_BUILD_STEP is not referenceable", () => {
	expect(() => {
		publicEnv
	}).not.toThrow()
})

it("should throw if a variable does not start with PUBLIC_", () => {
	expect(() => {
		// @ts-expect-error - we are testing an invalid variable
		publicEnv.INVALID_VARIABLE
	}).toThrow()
})
