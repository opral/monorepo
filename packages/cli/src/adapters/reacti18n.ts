import type { definitions } from "@inlang/database";

type File = {
  path: string;
  content: Object;
};

type AdapterExport = {
  files: File[];
};

type AllTranslations = {
  [locale: string]:
    | undefined
    | {
        [key: string]: string | undefined;
      };
};
export function exportI18nNext(args: {
  translations: definitions["translation"][];
}): AdapterExport {
  let files: File[] = [];
  let allTranslations: AllTranslations = {};

  for (const translation of args.translations) {
    if (allTranslations[translation.iso_code] === undefined) {
      // if the index is undefined, then initialize that index (locale) with an empty object
      allTranslations[translation.iso_code] = {};
    }
    allTranslations[translation.iso_code]![translation.key_name] =
      translation.text;
  }
  // using in here because we want the keys in alltranslations (the iso codes)
  // and not the values
  for (const iso in allTranslations) {
    files.push({
      path: `${iso}/translation.json`,
      content: allTranslations[iso]!,
    });
  }

  return {
    files: files,
  };
}
