import { it, expect } from "vitest"
import fs from "node:fs"
import { parse } from "dotenv"
import type { AllEnvVariables } from "../../schema.js"
import { rootEnvFilePath } from "../build/buildStepVariables.js"

// eases debugging and allows testing out new env variables without
// needing to configure them in doppler.
// * needs to run before other tests because it might write to the root .env file
it("should merge process.env variables with .env variables defined at the root of the repository", async () => {
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

// takes the env variables from process.env otherwise.
it("contain all keys of process.env", async () => {
	const { privateEnv } = await import("./privateEnv.js")
	expect(Object.keys(process.env).every((key) => Object.keys(privateEnv).includes(key))).toBe(true)
})
