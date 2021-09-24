/**
 * {
 *    "some.key": {
 *       "en": "Hello World",
 *       "de": "Hallo Welt"
 *    },
 * 	  "some.other": {
 *      "en": "How are you?"
 *      "fr": "Bonjour"
 *    }
 * }
 */
export type MockTranslations = {
	[key: string]:
		| undefined
		| {
				[locale: string]: string | undefined;
		  };
};

export type MockProject = {
	id: string;
	name: string;
	translations: MockTranslations;
	defaultLocale: string;
	// locale includes defaultLocale
	locales: string;
};
