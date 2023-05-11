import { z } from "zod"

const zUrlNegotiatorVariantPath = z.object({
	type: z.literal("path"),
	// level: z.number().default(0), // TODO: introduce option later
	/** `www.inlang.com/de` => 0 => `de` */
	/** `www.inlang.com/editor/de` => 1 => `de` */
})

const zUrlNegotiatorVariantDomain = z.object({
	type: z.literal("domain"),
	level: z.union([z.literal("tld"), z.literal("subdomain"), z.number()]),
})

const zUrlNegotiatorVariantQuery = z.object({
	type: z.literal("query"),
	parameter: z.string().default("lang"),
})

const zUrlNegotiator = z.object({
	type: z.literal("url"),
	variant: z
		.union(
			[
				zUrlNegotiatorVariantPath,
				// zUrlNegotiatorVariantDomain, // TODO: introduce option later
				// zUrlNegotiatorVariantQuery, // TODO: introduce option later
			] as any /* typecast needed because we currently only specify a single item */,
		)
		.default(zUrlNegotiatorVariantPath.parse({ type: "path" })),
})

const zCookieNegotiator = z.object({
	type: z.literal("cookie"),
	key: z.string().default("language"),
})

const zAcceptLanguageHeaderNegotiator = z.object({
	type: z.literal("acceptLanguageHeader"),
})

const zNavigatorNegotiator = z.object({
	type: z.literal("navigator"),
})

const zLocalStorageNegotiator = z.object({
	type: z.literal("localStorage"),
	key: z.string().default("language"),
})

const zSessionStorageNegotiator = z.object({
	type: z.literal("sessionStorage"),
	key: z.string().default("language"),
})

const zLanguageNegotiationStrategy = z.union([
	zUrlNegotiator,
	// zCookieNegotiator, // TODO: introduce option later
	zAcceptLanguageHeaderNegotiator,
	zNavigatorNegotiator,
	zLocalStorageNegotiator,
	// zSessionStorageNegotiator, // TODO: introduce option later
])

// ------------------------------------------------------------------------------------------------

const zResources = z.object({
	// in the future we will also support `number` to specify a TTL until resources get updated
	cache: z.literal('build-time').default('build-time'),
})

// ------------------------------------------------------------------------------------------------

const zSdkConfig = z.object({
	debug: z.boolean().default(false),
	languageNegotiation: z.object({
		strict: z.boolean().optional().default(false),
		strategies: z
			.array(zLanguageNegotiationStrategy)
			.min(1, "You must define at least one language negotiation strategy.")
			.transform(
				(t) =>
					t as [
						typeof zLanguageNegotiationStrategy._type,
						...(typeof zLanguageNegotiationStrategy._type)[],
					],
			),
	}),
	resources: zResources.default({ cache: 'build-time' }),
})

export const validateSdkConfig = (config?: SdkConfigInput): SdkConfig =>
	zSdkConfig.parse(config)

export type SdkConfigInput = z.input<typeof zSdkConfig>

export type SdkConfig = z.output<typeof zSdkConfig>
