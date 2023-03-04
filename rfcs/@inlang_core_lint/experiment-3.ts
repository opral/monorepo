/* eslint-disable @typescript-eslint/no-unused-vars */
// types

type LintLevel = "warn" | "error"

type LintSetting<Config = undefined> =
	| false
	| LintLevel
	| (Config extends undefined ? never : [LintLevel, Config])

type LintSettings<Key extends string, Config = undefined> = {
	[key in Key]?: LintSetting<Config>
}

type LintingConfig =
	| false
	| (LintSettings<"missing_property"> & LintSettings<"missing_key", { ignore: Array<string> }>)

type InlangConfig = {
	// ... all other properties
	linting?: LintingConfig
}

// ------------------------------------------------------------------------------------------------
// examples

// to completely disable linting
{
	const config: InlangConfig = {
		linting: false,
	}
}

// to disable a specific lint feature
{
	const config: InlangConfig = {
		linting: {
			missing_property: false,
		},
	}
}

// to set a specific linting level for a feature
{
	const config: InlangConfig = {
		linting: {
			missing_property: "warn",
		},
	}
}

// to configure a specific lint feature
{
	const config: InlangConfig = {
		linting: {
			missing_key: ["warn", { ignore: ["test-key"] }],
		},
	}
}
