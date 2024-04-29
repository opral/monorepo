import { config } from "dotenv"

// we configure the dotenv with default - which loads the .env file from the execution folder
config({ path: ["../../../.env", ".env"] })

export function getEnvVar(
	varName: string,
	{ descirption, default: defaultValue }: { descirption?: string; default?: string } = {}
) {
	const envVar = process.env[varName]
	if (typeof envVar === "undefined") {
		if (typeof defaultValue === "undefined") {
			throw new Error(
				"process.env[" +
					varName +
					"]" +
					(descirption ? " [" + descirption + "]" : "") +
					" is not defined but required."
			)
		} else {
			return defaultValue
		}
	}
	return envVar
}
