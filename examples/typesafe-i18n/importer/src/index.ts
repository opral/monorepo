import { storeTranslationToDisk } from "typesafe-i18n/importer";

const doImport = async () => {
	await storeTranslationToDisk({
		locale: 'de', translations: {
			test: "this is a test"
		}
	})
}

doImport()