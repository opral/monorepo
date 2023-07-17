import { type z, literal, union, string, number, object, boolean, array } from "zod"

const zUrlNegotiatorVariantPath = object({
	type: literal("path"),
	// level: number().default(0), // TODO: introduce option later
	/** `www.inlang.com/de` => 0 => `de` */
	/** `www.inlang.com/editor/de` => 1 => `de` */
})

const zUrlNegotiatorVariantDomain = object({
	type: literal("domain"),
	level: union([literal("tld"), literal("subdomain"), number()]),
})

const zUrlNegotiatorVariantQuery = object({
	type: literal("query"),
	parameter: string().default("lang"),
})

const zUrlNegotiator = object({
	type: literal("url"),
	variant: union(
		[
			zUrlNegotiatorVariantPath,
			// zUrlNegotiatorVariantDomain, // TODO: introduce option later
			// zUrlNegotiatorVariantQuery, // TODO: introduce option later
		] as any /* typecast needed because we currently only specify a single item */,
	).default(zUrlNegotiatorVariantPath.parse({ type: "path" })),
})

const zCookieNegotiator = object({
	type: literal("cookie"),
	key: string().default("language"),
})

const zAcceptLanguageHeaderNegotiator = object({
	type: literal("acceptLanguageHeader"),
})

const zNavigatorNegotiator = object({
	type: literal("navigator"),
})

const zLocalStorageNegotiator = object({
	type: literal("localStorage"),
	key: string().default("language"),
})

const zSessionStorageNegotiator = object({
	type: literal("sessionStorage"),
	key: string().default("language"),
})

const zLanguageNegotiationStrategy = union([
	zUrlNegotiator,
	// zCookieNegotiator, // TODO: introduce option later
	zAcceptLanguageHeaderNegotiator,
	zNavigatorNegotiator,
	zLocalStorageNegotiator,
	// zSessionStorageNegotiator, // TODO: introduce option later
])

// ------------------------------------------------------------------------------------------------

const zResources = object({
	// in the future we will also support `number` to specify a TTL until resources get updated
	cache: literal("build-time").default("build-time"),
})

// ------------------------------------------------------------------------------------------------

const zSdkConfig = object({
	debug: boolean().default(false),
	languageNegotiation: object({
		strict: boolean().optional().default(false),
		strategies: array(zLanguageNegotiationStrategy)
			.min(1, "You must define at least one language negotiation strategy.")
			.transform(
				(t) =>
					t as [
						typeof zLanguageNegotiationStrategy._type,
						...(typeof zLanguageNegotiationStrategy._type)[],
					],
			),
	}),
	resources: zResources.default({ cache: "build-time" }),
	routing: object({
		exclude: array(string().startsWith('/')).default([]),
	}).default({ exclude: [] }),
})

export const validateSdkConfig = (config?: SdkConfigInput): SdkConfig => zSdkConfig.parse(config)

export type SdkConfigInput = z.input<typeof zSdkConfig>

export type SdkConfig = z.output<typeof zSdkConfig>
