export type RoutingStrategyUserConfig =
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
	| {
			name: "searchParam"
			/**
			 * The name of the search param that contains the language tag.
			 * @default "lang"
			 */
			searchParamName?: string
	  }
	| undefined

export type RoutingStrategyConfig =
	| {
			name: "prefix"
			prefixDefault: boolean
	  }
	| {
			name: "domain"
			domains: Record<string, string>
	  }
	| {
			name: "searchParam"
			searchParamName: string
	  }

export function resolveRoutingStrategyConfig(
	userConfig: RoutingStrategyUserConfig
): RoutingStrategyConfig {
	if (!userConfig) {
		return { name: "prefix", prefixDefault: false }
	}

	switch (userConfig.name) {
		case "prefix": {
			return {
				name: "prefix",
				prefixDefault: userConfig.prefixDefault ?? false,
			}
		}
		case "domain": {
			return {
				name: "domain",
				domains: userConfig.domains,
			}
		}

		case "searchParam": {
			return {
				name: "searchParam",
				searchParamName: userConfig.searchParamName ?? "lang",
			}
		}
	}
}
