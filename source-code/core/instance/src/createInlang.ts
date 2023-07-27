import { InlangConfig } from "@inlang/config"
import type { InlangInstance } from "./api.js"
import type { InlangEnvironment } from "@inlang/environment"

export async function createInlang(args: {
	configPath: string
	env: InlangEnvironment
}): Promise<InlangInstance> {
	// TODO #1182 the filesystem type is incorrect. manual type casting is required
	const configFile = (await args.env.$fs.readFile(args.configPath, { encoding: "utf-8" })) as string
	const configJson = JSON.parse(configFile)
	const config: InlangConfig = InlangConfig.passthrough().parse(configJson)
	return {} as any
}
