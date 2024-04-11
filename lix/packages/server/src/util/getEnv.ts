import { config } from "dotenv"

// we configure the dotenv with default - which loads the .env file from the execution folder
config()

export function getEnvVar(varName: string, descirption: string, defaultValue?: string) {
	const envVar = process.env[varName]
	if (!envVar) {
		if (!defaultValue) {
			throw new Error(
				"process.env[" +
					varName +
					"]" +
					(descirption != "" ? " [" + descirption + "]" : "") +
					" is not defined but required."
			)
		} else {
			return defaultValue
		}
	}
	return envVar
}
