import { type Input, type Output, literal, union, string, number, object, boolean, array, useDefault, optional, startsWith, minLength, type ArraySchema, type StringSchema } from "valibot"

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
	parameter: useDefault(string(), "lang"),
})

const zUrlNegotiator = object({
	type: literal("url"),
	variant: useDefault(union(
		[
			zUrlNegotiatorVariantPath,
			// zUrlNegotiatorVariantDomain, // TODO: introduce option later
			// zUrlNegotiatorVariantQuery, // TODO: introduce option later
		] as any /* typecast needed because we currently only specify a single item */,
	), zUrlNegotiatorVariantPath.parse({ type: "path" })),
})

const zCookieNegotiator = object({
	type: literal("cookie"),
	key: useDefault(string(), "language"),
})

const zAcceptLanguageHeaderNegotiator = object({
	type: literal("acceptLanguageHeader"),
})

const zNavigatorNegotiator = object({
	type: literal("navigator"),
})

const zLocalStorageNegotiator = object({
	type: literal("localStorage"),
	key: useDefault(string(), "language"),
})

const zSessionStorageNegotiator = object({
	type: literal("sessionStorage"),
	key: useDefault(string(), "language"),
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
	cache: useDefault(literal("build-time"), "build-time"),
})

// ------------------------------------------------------------------------------------------------

const zSdkConfig = object({
	debug: useDefault(boolean(), false),
	languageNegotiation: object({
		strict: useDefault(optional(boolean()), false),
		strategies: array(
			zLanguageNegotiationStrategy,
			[minLength(1, "You must define at least one language negotiation strategy.")]
		)
		// TODO: find the valibot way of doing this
		// as unknown as ArraySchema<[typeof zLanguageNegotiationStrategy, ...typeof zLanguageNegotiationStrategy[]]>

		// .transform(
		// 	(t) =>
		// 		t as [
		// 			typeof zLanguageNegotiationStrategy._type,
		// 			...(typeof zLanguageNegotiationStrategy._type)[],
		// 		],
		// ),
	}),
	resources: useDefault(zResources, { cache: "build-time" }),
	routing: useDefault(object({
		exclude: useDefault(optional(array(string([startsWith("/")]))), []),
	}), { exclude: [] }),
})

export const validateSdkConfig = (config?: SdkConfigInput): SdkConfig => zSdkConfig.parse(config)

export type SdkConfigInput = Input<typeof zSdkConfig>

export type SdkConfig = Output<typeof zSdkConfig>
