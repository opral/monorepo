/** @type {import("@inlang/config").Config} */
export const config = {
	referenceLanguage: "en",
	languages: ["en", "de"],
	writeResource: async ({ fs, resource, languageCode }) => {},
	readResource: async ({ fs, languageCode }) => {
		const resource = await import(`./resources/${languageCode}.js`);
		return { type: "Resource", body: resource };
	},
	ideExtension: {
		extractMessageReplacementOptions: ({ id }) => [
			`{$t("${id}")}`,
			`$t("${id}")`,
		],
		documentSelectors: [
			"javascript",
			"typescript",
			"javascriptreact",
			"typescriptreact",
			"svelte",
		],
	},
};
