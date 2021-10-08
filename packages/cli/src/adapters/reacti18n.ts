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

export function exportI18nNext(
  translations: definitions["translation"][]
): AdapterExport {
  let existingIso =false;
  file = translations.map((translation) => {
    for(int i=0; i<Array.length; i++){
      if(array.find("/".concat(translation.iso_code))){
      ({ key: translation.key_name, translation.key_text}))
    existingIso=true;
    }
    }
    if(!existingIso) {
      //add iso code and translation
    }

    
};
}

