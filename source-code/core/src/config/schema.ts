import type { Language } from "../ast/index.js"
import type * as ast from "../ast/index.js"
import type { LintRule } from "../lint/rule.js"
import type { $fs } from "./environment-functions/$fs.js"
import type { $import } from "./environment-functions/$import.js"

/**
 * The environment functions.
 *
 * Read more https://inlang.com/documentation/environment-functions
 */
export type EnvironmentFunctions = {
	$fs: $fs
	$import: $import
}

/**
 * The inlang config function.
 *
 * Read more https://inlang.com/documentation/config
 */
export type DefineConfig = (args: EnvironmentFunctions) => Promise<Config>

/**
 * Inlang config schema.
 *
 * Read more https://inlang.com/documentation/config
 */
export type Config = {
	/**
	 * The reference language that other messages are validated against.
	 *
	 * The languages can be named freely. It's advisable to follow the IETF BCP 47 language tag scheme.
	 * In most cases, the reference language is `en-US` (American English).
	 *
	 * @see https://www.ietf.org/rfc/bcp/bcp47.txt
	 * @see https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
	 */
	referenceLanguage: Language
	/**
	 * Available languages in this project.
	 *
	 * The languages can be named freely. It's advisable to follow the IETF BCP 47 language tag scheme.
	 *
	 * @see https://www.ietf.org/rfc/bcp/bcp47.txt
	 * @see https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
	 */
	languages: Language[]
	readResources: (args: { config: Config }) => Promise<ast.Resource[]>
	writeResources: (args: { config: Config; resources: ast.Resource[] }) => Promise<void>
	lint?: {
		rules: (LintRule | LintRule[])[]
	}

	/**
	 * WARNING: Experimental properties are not required,
	 * can change at any time and do not lead to a MAJOR version bump.
	 *
	 * Read more under https://inlang.com/documentation/breaking-changes
	 */
	experimental?: Record<string, unknown>

	ideExtension?: {
		/**
		 * Defines matchers for message references inside the code.
		 *
		 * @param args represents the data to conduct the search on
		 * @returns a promise with matched message references
		 */
		messageReferenceMatchers: ((args: { documentText: string }) => Promise<
			Array<{
				/**
				 * The messages id.
				 */
				messageId: string
				/**
				 * The position from where to where the reference can be found.
				 */
				position: {
					start: { line: number; character: number }
					end: { line: number; character: number }
				}
			}>
		>)[]

		/**
		 * Defines the options to extract messages.
		 */
		extractMessageOptions: {
			/**
			 * Function which is called, when the user finished the message extraction command.
			 *
			 * @param messageId is the message identifier entered by the user
			 * @param selection is the text which was extracted
			 * @returns the code which is inserted into the document
			 */
			callback: (messageId: string, selection: string) => string
		}[]

		/**
		 * An array of VSCode DocumentSelectors.
		 *
		 * The document selectors specify for which files/programming languages
		 * (typescript, svelte, etc.) the extension should be activated.
		 *
		 * See https://code.visualstudio.com/api/references/document-selector
		 */
		// documentSelectors: DocumentSelector[];
	}

	sdk?: {
		languageNegotiation?: {
			/* default: false */
			strict?: boolean
			/* default: [UrlNegotiator, staticOutput ? NavigatorNegotiator : AcceptLanguageNegotiator] */
			strategies?: LanguageNegotiationStrategy[]
		}
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
	| CookieNegotiator
	| NavigatorNegotiator
	| LocalStorageNegotiator
	| SessionStorageNegotiator

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

const sdKConfig1: Config["sdk"] = {}

const sdKConfig2: Config["sdk"] = {
	languageNegotiation: {},
}
const sdKConfig3: Config["sdk"] = {
	languageNegotiation: {
		strategies: [],
	},
}
const sdKConfig4: Config["sdk"] = {
	languageNegotiation: {
		strategies: [
			{
				type: "url",
			},
		],
	},
}

const sdKConfig5: Config["sdk"] = {
	languageNegotiation: {
		strict: true,
		strategies: [
			{
				type: "url",
				variant: {
					type: 'query',
					parameter: 'lang'
				}
			}
		],
	},
}

const sdKConfig6: Config["sdk"] = {
	languageNegotiation: {
		strategies: [
			{
				type: "url",
				variant: {
					type: "domain",
					level: 1
				}
			}
		],
	},
}
