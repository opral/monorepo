import type { definitions } from '@inlang/database';

type File = {
	path: string;
	content: Record<string, string | undefined> | undefined;
};

type AdapterExport = {
	files: File[];
};

/**
 * a locale can be undefined e.g.
 * "fr" does not exist in the project locales ["de", "en"]
 *
 * a key can be undefined for a specific locale because
 * "example.hello" may not exist for "de", but for "en"
 */
type AllTranslations = {
	[locale: string]:
		| undefined
		| {
				[key: string]: string | undefined;
		  };
};

export function exportI18nNext(args: {
	translations: definitions['translation'][];
}): AdapterExport {
	const files: File[] = [];
	const allTranslations: AllTranslations = {};

	for (const translation of args.translations) {
		if (allTranslations[translation.iso_code] === undefined) {
			// if the index is undefined, then initialize that index (locale) with an empty object
			allTranslations[translation.iso_code] = {};
		}
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		allTranslations[translation.iso_code]![translation.key_name] = translation.text;
		//eslint thinks allTranslations[translation.iso_code] can be undefined which it can't.
	}
	// using in here because we want the keys in alltranslations (the iso codes)
	// and not the values
	for (const iso in allTranslations) {
		files.push({
			path: `./public/locales/${iso}/translation.json`,
			content: allTranslations[iso]
		});
	}

	return {
		files: files
	};
}

/*  export async function importI18next( args: {obj: Object;}) {

   
    await database.from('messages').upsert({});
 
  }*/
