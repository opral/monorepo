export type RoutingStrategyConfig =
	| {
			name: "prefix"

			/**
			 * If the default language should be prefixed with the language tag.
			 * If false, the default language will start at `/` instead of `/{lang}/`
			 */
			prefixDefault: boolean
	  }
	| {
			name: "domain"

			/**
			 * Map each language tag to its domain.
			 * Do _not_ include the protocol (http:// or https://) or trailing slash.
			 */
			domains: Record<string, string>
	  }
