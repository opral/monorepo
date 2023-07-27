import { z } from "zod"

const PluginSchema = z.object({
	module: z.string(),
	options: z.record(z.string()),
})

export const InlangConfigSchema = z.object({
	// TODO validate valid language tag
	sourceLanguageTag: z.string(),
	// TODO validate valid language tags
	languageTags: z.array(z.string()),
	plugins: z.array(PluginSchema),
	lint: z.object({
		rules: z.record(z.union([z.literal("off"), z.literal("warning"), z.literal("error")])),
	}),
})

export type InlangConfig = z.infer<typeof InlangConfigSchema>
