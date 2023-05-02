import { z } from "zod"

const zUrlNegotiatorVariantPath = z.object({
	type: z.literal("path"),
	level: z.number().optional(),
})

const zUrlNegotiatorVariantDomain = z.object({
	type: z.literal("domain"),
	level: z.union([z.literal("tld"), z.literal("subdomain"), z.number()]).optional(),
})

const zUrlNegotiatorVariantQuery = z.object({
	type: z.literal("query"),
	parameter: z.string().optional(),
})

const zUrlNegotiator = z.object({
	type: z.literal("url"),
	variant: z.union([
		zUrlNegotiatorVariantPath,
		zUrlNegotiatorVariantDomain,
		zUrlNegotiatorVariantQuery,
	]),
})

const zAcceptLanguageHeaderNegotiator = z.object({
	type: z.literal("accept-language-header"),
	name: z.string().optional(),
})

const zNavigatorNegotiator = z.object({
	type: z.literal("navigator"),
})

const zLocalStorageNegotiator = z.object({
	type: z.literal("localStorage"),
	key: z.string().optional(),
})

const zLanguageNegotiationStrategy = z.union([
	zUrlNegotiator,
	zAcceptLanguageHeaderNegotiator,
	zNavigatorNegotiator,
	zLocalStorageNegotiator,
])

const zConfig = z.object({
	languageNegotiation: z.object({
		strict: z.boolean().optional().default(false),
		strategies: z
			.array(zLanguageNegotiationStrategy)
			.min(1, "You must define at least one language negotiation strategy."),
	}),
})

export const validateSdkConfig = (config: SdkConfig | undefined) => zConfig.parse(config)

export type SdkConfig = {
	languageNegotiation: {
		strict?: boolean
		strategies: [LanguageNegotiationStrategy, ...LanguageNegotiationStrategy[]]
	}
}

type LanguageNegotiatorType =
	| "url"
	| "cookie"
	| "accept-language-header"
	| "navigator"
	| "localStorage"
	| "sessionStorage"

type LanguageNegotiatorBase<Type extends LanguageNegotiatorType, Settings = never> = [
	Settings,
] extends [never]
	? { type: Type }
	: Settings & { type: Type }

type LanguageNegotiationStrategy =
	/* default */
	| UrlNegotiator
	| AcceptLanguageHeaderNegotiator
	// | CookieNegotiator
	| NavigatorNegotiator
	| LocalStorageNegotiator
// | SessionStorageNegotiator

type UrlNegotiatorVariantBase<Type, Settings> = Settings & { type: Type }

type UrlNegotiatorVariantQuery = UrlNegotiatorVariantBase<
	"query",
	{
		parameter?: string
	}
>

type UrlNegotiatorVariantDomain = UrlNegotiatorVariantBase<
	"domain",
	{
		level:
			| never /* just to make formatter happy */
			/** `www.inlang.de` => `de` */
			| "tld"
			/** `de.inlang.com` => `de` */
			| "subdomain"
			/** `de.editor.inlang.com` => 1 => `de` */
			/** `de.example.beta.editor.inlang.com` => 4 => `de` */
			| number
	}
>

type UrlNegotiatorVariantPath = UrlNegotiatorVariantBase<
	"path",
	{
		/* default: 1 */
		/** `www.inlang.com/de` => 1 => `de` */
		/** `www.inlang.com/editor/de` => 2 => `de` */
		level?: number
	}
>

type UrlNegotiator = LanguageNegotiatorBase<
	"url",
	{
		variant?: /* default */
		UrlNegotiatorVariantPath | UrlNegotiatorVariantDomain | UrlNegotiatorVariantQuery
	}
>

type AcceptLanguageHeaderNegotiator = LanguageNegotiatorBase<
	"accept-language-header",
	{
		/* default: 'language' */
		name?: string
	}
>

type CookieNegotiator = LanguageNegotiatorBase<
	"cookie",
	{
		/* default: 'language' */
		name?: string
	}
>

type LocalStorageNegotiator = LanguageNegotiatorBase<
	"localStorage",
	{
		/* default: 'language' */
		name?: string
	}
>

type SessionStorageNegotiator = LanguageNegotiatorBase<
	"sessionStorage",
	{
		/* default: 'language' */
		name?: string
	}
>

type NavigatorNegotiator = LanguageNegotiatorBase<"navigator">

// --------------------------------
// tests

// const sdKConfig1: SdkConfig = {}

// const sdKConfig2: SdkConfig = {
// 	languageNegotiation: {},
// }
// const sdKConfig3: SdkConfig = {
// 	languageNegotiation: {
// 		strategies: [],
// 	},
// }
// const sdKConfig4: SdkConfig = {
// 	languageNegotiation: {
// 		strategies: [
// 			{
// 				type: "url",
// 			},
// 		],
// 	},
// }

// const sdKConfig5: SdkConfig = {
// 	languageNegotiation: {
// 		strict: true,
// 		strategies: [
// 			{
// 				type: "url",
// 				variant: {
// 					type: 'query',
// 					parameter: 'lang'
// 				}
// 			}
// 		],
// 	},
// }

// const sdKConfig6: SdkConfig = {
// 	languageNegotiation: {
// 		strategies: [
// 			{
// 				type: "url",
// 				variant: {
// 					type: "domain",
// 					level: 1
// 				}
// 			}
// 		],
// 	},
// }
