// this config is used to test sandboxing

/** @type {import('./schema').Schema} */
export const config = {
	referenceLanguage: "en",
	languages: ["en", "de", "fr"],
	testFunction: (name) => {
		return `Hello ${name}`;
	},
};
