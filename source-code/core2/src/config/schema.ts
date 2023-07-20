import { z } from "zod"

const PluginSchema = z.object({
	module: z.string(),
	options: z.record(z.string()),
})

export const InlangConfigSchema = z.object({
	sourceLanguageTag: z.string(),
	languageTags: z.array(z.string()),
	plugins: z.array(PluginSchema),
})

export type InlangConfig = z.infer<typeof InlangConfigSchema>
