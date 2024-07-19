const mockSetting = {
	$schema: "https://inlang.com/schema/project-settings",
	sourceLanguageTag: "en",
	languageTags: ["en", "de"],
	messageLintRuleLevels: {
		"messageLintRule.inlang.identicalPattern": "error",
	},
	modules: ["https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@4/dist/index.js"],
	"plugin.inlang.i18next": {
		pathPattern: "./frontend/public/locales/{languageTag}/brain.json",
	},
}

export { mockSetting }
