/** @type {import("@inlang/config").Config} */
export const config = {
	referenceLanguage: "en",
	languages: ["en", "de"],
	writeResource: async ({ fs, resource, languageCode }) => {},
	readResource: async ({ fs, languageCode }) => {
		const resource = await import(`./resources/${languageCode}.js`);
		console.log(resource);
		return { type: "Resource", body: [] };
	},
};
