import { schema } from "./schema.js"
import { privateEnv } from "./src/privateEnv.js"

process.env._VALIDATING_ENV_VARIABLES = "true"

const result = schema.safeParse(privateEnv)

if (result.success === false) {
	throw new Error(
		`Invalid environment variables\n\n${result.error.issues
			.map((issue) => issue.path + ": " + issue.message)
			.join("\n")}\n`,
	)
}

console.log("environment variables are valid! ✅")
