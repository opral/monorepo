import { it, expect } from "vitest"
import fs from "node:fs"
import { parse } from "dotenv"
import type { AllEnvVariables } from "../schema.js"

// eases debugging and allows testing out new env variables without
// needing to configure them in doppler.
// * needs to run before other tests because it might write to the root .env file
it("should merge process.env variables with .env variables defined at the root of the repository", async () => {
	const rootEnvFilePath = new URL("../../../.env", import.meta.url).pathname
	if (fs.existsSync(rootEnvFilePath) === false) {
		fs.writeFileSync(rootEnvFilePath, `API_TOKEN="something"`, { encoding: "utf-8" })
		const { privateEnv } = await import("./privateEnv.js")
		// @ts-expect-error - API token is defined in this test
		expect(privateEnv.API_TOKEN).toBe("something")
		fs.rmSync(rootEnvFilePath)
	} else {
		const { privateEnv } = await import("./privateEnv.js")
		const env = parse(rootEnvFilePath)
		for (const key of Object.keys(env)) {
			expect(privateEnv[key as keyof AllEnvVariables]).toBe(env[key])
		}
	}
})

it("should throw if a variable is missing", async () => {
	const { privateEnv } = await import("./privateEnv.js")
	expect(() => {
		// @ts-expect-error - we are testing an invalid variable
		privateEnv.MISSING_VARIABLE
	}).toThrow()
})

it("should not throw if the validation script is executing", async () => {
	const { privateEnv } = await import("./privateEnv.js")
	process.env._VALIDATING_ENV_VARIABLES = "true"
	expect(() => {
		privateEnv
	}).not.toThrow()
	delete process.env._VALIDATING_ENV_VARIABLES
})
