import type { definitions } from "@inlang/database";
import { DatabaseResponse } from "@inlang/dashboard/src/lib/types/databaseResponse";
import { database } from "@inlang/dashboard/src/lib/services/database";

let translations: DatabaseResponse<definitions["translation"][]>;

type AdapterExport = {
  files: Array<{
    path: string;
    content: Object;
  }>;
};

//create object for each locale, object has keys which are locales and values which are (paths, content)
/*
export function exportI18nNext(
  translations: definitions["translation"][]
): AdapterExport {
  translations.forEach (translation)
  file = translations.map((translation) => ({ key: translation.key_name, translation.key_text}));
}
*/
