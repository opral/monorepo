import type { InlangProject } from "@inlang/sdk"

export const mockSettings: ReturnType<InlangProject["settings"]> = {
	$schema: "https://inlang.com/schema/project-settings",
	sourceLanguageTag: "en",
	languageTags: ["en", "es", "fr", "pt-br", "ru", "zh-cn"],
	messageLintRuleLevels: {
		"messageLintRule.inlang.identicalPattern": "error",
	},
	modules: [
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@4/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@latest/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@latest/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@latest/dist/index.js",
	],
	"plugin.inlang.i18next": {
		pathPattern: {
			brain: "./frontend/public/locales/{languageTag}/brain.json",
			chat: "./frontend/public/locales/{languageTag}/chat.json",
			config: "./frontend/public/locales/{languageTag}/config.json",
			contact: "./frontend/public/locales/{languageTag}/contact.json",
			deleteOrUnsubscribeFormBrain:
				"./frontend/public/locales/{languageTag}/deleteOrUnsubscribeFormBrain.json",
			explore: "./frontend/public/locales/{languageTag}/explore.json",
			external_api_definition:
				"./frontend/public/locales/{languageTag}/external_api_definition.json",
			home: "./frontend/public/locales/{languageTag}/home.json",
			invitation: "./frontend/public/locales/{languageTag}/invitation.json",
			knowledge: "./frontend/public/locales/{languageTag}/knowledge.json",
			login: "./frontend/public/locales/{languageTag}/login.json",
			logout: "./frontend/public/locales/{languageTag}/logout.json",
			monetization: "./frontend/public/locales/{languageTag}/monetization.json",
			translation: "./frontend/public/locales/{languageTag}/translation.json",
			upload: "./frontend/public/locales/{languageTag}/upload.json",
			user: "./frontend/public/locales/{languageTag}/user.json",
		},
	},
}

export const mockInstalledPlugins = [
	{
		id: "plugin.inlang.i18next",
		displayName: {
			en: "i18next",
		},
		description: {
			en: "i18next",
		},
		module: "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@4/dist/index.js",
		settingsSchema: {
			type: "object",
			properties: {
				pathPattern: {
					title: "Path to language files",
					anyOf: [
						{
							pattern: "^(\\./|\\../|/)[^*]*\\{languageTag\\}[^*]*\\.json",
							description:
								"Specify the pathPattern to locate language files in your repository. It must include `{languageTag}` and end with `.json`.",
							examples: [
								"./{languageTag}/file.json",
								"../folder/{languageTag}/file.json",
								"./{languageTag}.json",
							],
							type: "string",
						},
						{
							type: "object",
							patternProperties: {
								"^[^.]+$": {
									pattern: "^(\\./|\\../|/)[^*]*\\{languageTag\\}[^*]*\\.json",
									description: "It must include `{languageTag}` and end with `.json`.",
									examples: [
										"./{languageTag}/file.json",
										"../folder/{languageTag}/file.json",
										"./{languageTag}.json",
									],
									type: "string",
								},
							},
						},
					],
				},
				variableReferencePattern: {
					type: "array",
					title: "Variable reference pattern",
					description:
						"The pattern to match content in the messages. You can define an opening and closing pattern. The closing pattern is not required. The default is '{{' and '}}'.",
					examples: ["{ and }", "{{ and }}", "< and >", "@:"],
					items: {
						type: "string",
					},
				},
				sourceLanguageFilePath: {
					title: "Source language file path",
					description:
						"Sometimes it is necessary to specify the location of the source language file(s) when they do not follow the standard naming or file structure convention.",
					anyOf: [
						{
							pattern: "^(\\./|\\../|/)[^*]*\\{languageTag\\}[^*]*\\.json",
							description: "The pathPattern must contain `{languageTag}` and end with `.json`.",
							examples: [
								"./{languageTag}/file.json",
								"../folder/{languageTag}/file.json",
								"./{languageTag}.json",
							],
							type: "string",
						},
						{
							type: "object",
							patternProperties: {
								"^[^.]+$": {
									pattern: "^(\\./|\\../|/)[^*]*\\{languageTag\\}[^*]*\\.json",
									description: "The pathPattern must contain `{languageTag}` and end with `.json`.",
									examples: [
										"./{languageTag}/file.json",
										"../folder/{languageTag}/file.json",
										"./{languageTag}.json",
									],
									type: "string",
								},
							},
						},
					],
				},
				ignore: {
					type: "array",
					title: "Ignore paths",
					description: "Set a path that should be ignored.",
					items: {
						type: "string",
					},
				},
			},
			required: ["pathPattern"],
		},
	},
]

export const mockInstalledMessageLintRules = [
	{
		id: "messageLintRule.inlang.emptyPattern",
		displayName: {
			en: "Empty Pattern",
		},
		description: {
			en: "Empty Pattern",
		},
		module:
			"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js",
	},
	{
		id: "messageLintRule.inlang.identicalPattern",
		displayName: {
			en: "Identical Pattern",
		},
		description: {
			en: "Identical Pattern",
		},
		module:
			"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@latest/dist/index.js",
		settingsSchema: {
			type: "object",
			properties: {
				ignore: {
					type: "array",
					items: {
						pattern: "[^*]",
						description: "All items in the array need quotaion marks at the end and beginning",
						type: "string",
					},
					title: "DEPRICATED. Ignore paths",
					description: "Set a path that should be ignored.",
				},
			},
		},
	},
	{
		id: "messageLintRule.inlang.missingTranslation",
		displayName: {
			en: "Missing Translation",
		},
		description: {
			en: "Missing Translation",
		},
		module:
			"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@latest/dist/index.js",
	},
	{
		id: "messageLintRule.inlang.messageWithoutSource",
		displayName: {
			en: "Message Without Source",
		},
		description: {
			en: "Message Without Source",
		},
		module:
			"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@latest/dist/index.js",
	},
]

// export const mockProject = {
// 	id: "mock-project",
// 	installed: {
// 		plugins: () => [
// 			{
// 				id: "plugin.inlang.i18next",
// 				displayName: {
// 					en: "i18next",
// 				},
// 				description: {
// 					en: "i18next",
// 				},
// 				module: "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@4/dist/index.js",
// 				settingsSchema: {
// 					type: "object",
// 					properties: {
// 						pathPattern: {
// 							anyOf: [
// 								{
// 									pattern: "^(\\./|\\../|/)[^*]*\\{languageTag\\}[^*]*\\.json",
// 									description: "The pathPattern must contain `{languageTag}` and end with `.json`.",
// 									examples: [
// 										"./{languageTag}/file.json",
// 										"../folder/{languageTag}/file.json",
// 										"./{languageTag}.json",
// 									],
// 									type: "string",
// 								},
// 								{
// 									type: "object",
// 									patternProperties: {
// 										"^[^.]+$": {
// 											pattern: "^(\\./|\\../|/)[^*]*\\{languageTag\\}[^*]*\\.json",
// 											description:
// 												"The pathPattern must contain `{languageTag}` and end with `.json`.",
// 											examples: [
// 												"./{languageTag}/file.json",
// 												"../folder/{languageTag}/file.json",
// 												"./{languageTag}.json",
// 											],
// 											type: "string",
// 										},
// 									},
// 								},
// 							],
// 						},
// 						variableReferencePattern: {
// 							type: "array",
// 							items: {
// 								type: "string",
// 							},
// 						},
// 						sourceLanguageFilePath: {
// 							anyOf: [
// 								{
// 									pattern: "^(\\./|\\../|/)[^*]*\\{languageTag\\}[^*]*\\.json",
// 									description: "The pathPattern must contain `{languageTag}` and end with `.json`.",
// 									examples: [
// 										"./{languageTag}/file.json",
// 										"../folder/{languageTag}/file.json",
// 										"./{languageTag}.json",
// 									],
// 									type: "string",
// 								},
// 								{
// 									type: "object",
// 									patternProperties: {
// 										"^[^.]+$": {
// 											pattern: "^(\\./|\\../|/)[^*]*\\{languageTag\\}[^*]*\\.json",
// 											description:
// 												"The pathPattern must contain `{languageTag}` and end with `.json`.",
// 											examples: [
// 												"./{languageTag}/file.json",
// 												"../folder/{languageTag}/file.json",
// 												"./{languageTag}.json",
// 											],
// 											type: "string",
// 										},
// 									},
// 								},
// 							],
// 						},
// 						ignore: {
// 							type: "array",
// 							items: {
// 								type: "string",
// 							},
// 						},
// 					},
// 					required: ["pathPattern"],
// 				},
// 			},
// 		],
// 		messageLintRules: () => [
// 			{
// 				id: "messageLintRule.inlang.emptyPattern",
// 				displayName: {
// 					en: "Empty Pattern",
// 				},
// 				description: {
// 					en: "Empty Pattern",
// 				},
// 				module:
// 					"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js",
// 			},
// 			{
// 				id: "messageLintRule.inlang.identicalPattern",
// 				displayName: {
// 					en: "Identical Pattern",
// 				},
// 				description: {
// 					en: "Identical Pattern",
// 				},
// 				module:
// 					"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@latest/dist/index.js",
// 				settingsSchema: {
// 					type: "object",
// 					properties: {
// 						ignore: {
// 							type: "array",
// 							items: {
// 								pattern: "[^*]",
// 								description: "All items in the array need quotaion marks at the end and beginning",
// 								type: "string",
// 							},
// 						},
// 					},
// 				},
// 			},
// 			{
// 				id: "messageLintRule.inlang.missingTranslation",
// 				displayName: {
// 					en: "Missing Translation",
// 				},
// 				description: {
// 					en: "Missing Translation",
// 				},
// 				module:
// 					"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@latest/dist/index.js",
// 			},
// 			{
// 				id: "messageLintRule.inlang.messageWithoutSource",
// 				displayName: {
// 					en: "Message Without Source",
// 				},
// 				description: {
// 					en: "Message Without Source",
// 				},
// 				module:
// 					"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@latest/dist/index.js",
// 			},
// 		],
// 	},
// 	errors: () => [],
// 	settings: () => mockSettings,
// 	setSettings: (settings: any) => (mockSettings = settings),
// }
