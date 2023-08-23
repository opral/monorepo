import {
	type Input,
	type Output,
	literal,
	union,
	string,
	number,
	object,
	boolean,
	array,
	withDefault,
	optional,
	startsWith,
	minLength,
	parse,
} from "valibot"

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
	parameter: withDefault(string(), "lang"),
})

const zUrlNegotiator = object({
	type: literal("url"),
	variant: withDefault(
		union(
			[
				zUrlNegotiatorVariantPath,
				// zUrlNegotiatorVariantDomain, // TODO: introduce option later
				// zUrlNegotiatorVariantQuery, // TODO: introduce option later
			] as any /* typecast needed because we currently only specify a single item */,
		),
		parse(zUrlNegotiatorVariantPath, { type: "path" }),
	),
})

const zCookieNegotiator = object({
	type: literal("cookie"),
	key: withDefault(string(), "language"),
})

const zAcceptLanguageHeaderNegotiator = object({
	type: literal("acceptLanguageHeader"),
})

const zNavigatorNegotiator = object({
	type: literal("navigator"),
})

const zLocalStorageNegotiator = object({
	type: literal("localStorage"),
	key: withDefault(string(), "language"),
})

const zSessionStorageNegotiator = object({
	type: literal("sessionStorage"),
	key: withDefault(string(), "language"),
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
	cache: withDefault(literal("build-time"), "build-time"),
})

// ------------------------------------------------------------------------------------------------

const zSdkConfig = object({
	debug: withDefault(optional(boolean()), false),
	languageNegotiation: object({
		strict: withDefault(optional(boolean()), false),
		strategies: array(zLanguageNegotiationStrategy, [
			minLength(1, "You must define at least one language negotiation strategy."),
		]),
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
	resources: withDefault(optional(zResources), { cache: "build-time" }),
	routing: withDefault(
		optional(
			object({
				exclude: withDefault(optional(array(string([startsWith("/")]))), []),
			}),
		),
		{ exclude: [] },
	),
})

export const validateSdkConfig = (config?: SdkConfigInput): SdkConfig =>
	parse(zSdkConfig, config) as SdkConfig

export type SdkConfigInput = Input<typeof zSdkConfig>

// TODO: https://github.com/fabian-hiller/valibot/issues/118
export type SdkConfig = Fix<Output<typeof zSdkConfig>>

type Fix<T extends Record<string, unknown>> = {
	[K in keyof T]-?: Exclude<T[K], undefined>
}
