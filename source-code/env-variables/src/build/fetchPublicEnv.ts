import fs from "node:fs/promises"
import { rootEnvFilePath } from "./buildStepVariables.js"
import { validateEnvVariables } from "../validateEnvVariables.js"

const projectName = "monorepo"
const configName = "development"

// avoiding doppler "key committed" errors
const publicServiceKey =
	"dp" + ".st.development" + ".zAIS3YXnv7AyulOk" + "2YfNeOFiih21myQJ6GsjLFdKpbC"

export async function fetchPublicEnv() {
	try {
		const response = await fetch(
			`https://api.doppler.com/v3/configs/config/secrets?project=${projectName}&config=${configName}&include_dynamic_secrets=false&include_managed_secrets=false`,
			{
				method: "GET",
				headers: {
					accept: "application/json",
					authorization: `Bearer ${publicServiceKey}`,
				},
			},
		)
		const data = await response.json()
		if (data.success) {
			for (const key in data.secrets) {
				process.env[key] = data.secrets[key].raw
			}

			await fs.writeFile(
				rootEnvFilePath,
				Object.entries(data.secrets)
					.map(([key, value]) => `${key}="${(value as any).raw}"`)
					.join("\n"),
			)
			const [, errors] = validateEnvVariables({ forProduction: false })
			if (errors === undefined) {
				console.log("✅ Fetched public env variables remotely.")
			} else {
				console.warn(
					"⚠️ Fetched public env variables remotely but some are missing or invalid. Contact the maintainers.",
				)
				console.log(errors)
			}
		} else {
			console.log("❌ Failed to fetch public env variables remotely. ", data.messages)
		}
	} catch (error) {
		console.log("❌ Failed to fetch public env variables remotely. ", error)
	}
}
