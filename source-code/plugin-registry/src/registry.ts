import type { InlangPluginManifest } from "./schema.js"

export const plugins: InlangPluginManifest[] = [
	{
		id: "i18next",
		icon: "https://github.com/inlang/inlang/blob/main/source-code/plugins/i18next/assets/icon.png?raw=true",
		repository: "https://github.com/inlang/inlang/tree/main/source-code/plugins/i18next",
		keywords: ["json", "i18next", "placeholder"],
	},
	{
		id: "standard-lint-rules",
		icon: "https://github.com/samuelstroschein/inlang-plugin-json/assets/icon.png",
		repository:
			"https://github.com/inlang/inlang/blob/main/source-code/plugins/standard-lint-rules/assets/icon.png?raw=true",
		keywords: ["lint", "inlang", "report", "missingMessage"],
	},
	{
		id: "inlang-plugin-json",
		icon: "https://github.com/samuelstroschein/inlang-plugin-json/assets/icon.png",
		repository: "https://github.com/samuelstroschein/inlang-plugin-json",
		keywords: ["json", "placeholder"],
	},
	{
		id: "inlang-plugin-yaml",
		icon: "https://github.com/felixhaeberle/inlang-plugin-yaml/blob/main/assets/icon.png?raw=true",
		repository: "https://github.com/felixhaeberle/inlang-plugin-yaml",
		keywords: ["yaml", "yml"],
	},
	{
		id: "inlang-plugin-po",
		icon: "https://github.com/jannesblobel/inlang-plugin-po/blob/main/assets/icon.png?raw=true",
		repository: "https://github.com/jannesblobel/inlang-plugin-po",
		keywords: ["po", "python"],
	},
]
