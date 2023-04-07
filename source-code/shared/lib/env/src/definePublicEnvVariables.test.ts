import { it, expect } from "vitest"
import { definePublicEnvVariables } from "./definePublicEnvVariables.js"

it("should return a stringified JSON because bundlers expect a stringified JSON", () => {
	const def = definePublicEnvVariables({} as any)
	expect(def).toHaveProperty("ENV_DEFINED_IN_BUILD_STEP")
	expect(typeof def.ENV_DEFINED_IN_BUILD_STEP).toBe("string")
	expect(JSON.parse(def.ENV_DEFINED_IN_BUILD_STEP)).toBeInstanceOf(Object)
})

it('should only define env variables that start with "PUBLIC_"', () => {
	const def = definePublicEnvVariables({
		PUBLIC_BASE_URL: "https://inlang.com",
		API_TOKEN: "blabla",
	})
	const env = JSON.parse(def.ENV_DEFINED_IN_BUILD_STEP)
	expect(env.PUBLIC_BASE_URL).toBe("https://inlang.com")
	expect(env).not.toHaveProperty("API_TOKEN")
})
