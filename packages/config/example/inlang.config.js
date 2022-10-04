/**
 * @type {import("../dist/schema").Schema}
 */
export const config = {
	referenceLanguage: "en",
	languages: ["en", "de"],
	readResource: async ({ fs, languageCode, ast }) => {
		const file = JSON.parse(
			await fs.readFile(`./example/${languageCode}.json`)
		);
		let resource = new ast.Resource([]);
		for (const key in file) {
			resource = resource
				.createMessage(Message.from({ id: key, value: file[key] }).unwrap())
				.unwrap();
		}
		return resource;
	},
};
