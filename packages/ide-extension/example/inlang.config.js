/** @type {import("@inlang/core/config").Config} */
export const config = {
	referenceBundleId: "en",
	bundleIds: ["en", "de"],
	// writeResource: async ({ fs, resource, path }) => {},
	// readResource: async ({ fs, path }) => {
	// 	const resource = await import(path);
	// 	return { type: "Resource", body: resource };
	// },
	readBundles: async ({ fs }) => {
		const en = await import("./resources/en.js");
		const de = await import("./resources/de.js");
		return [
			{
				type: "Bundle",
				id: { type: "Identifier", name: "en" },
				// @ts-ignore
				resources: [resourceFrom(en)],
			},
			{
				type: "Bundle",
				id: { type: "Identifier", name: "de" },
				// @ts-ignore
				resources: [resourceFrom(de)],
			},
		];
	},
	// resources: () => ({
	// 	en: ["./resources/en.js"],
	// 	de: ["./resources/de.js"],
	// }),
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

/**
 * @param {Record<string, string>} input
 * @returns {import("@inlang/core/ast").Resource}
 */
function resourceFrom(input) {
	/** @type {import("@inlang/core/ast").Resource['body']} */
	let body = [];
	for (const id in input) {
		body.push({
			type: "Message",
			id: { type: "Identifier", name: id },
			pattern: {
				type: "Pattern",
				elements: [{ type: "Text", value: input[id] }],
			},
		});
	}
	return { type: "Resource", body };
}
