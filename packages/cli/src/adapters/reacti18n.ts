import type { definitions } from "@inlang/database";
import { DatabaseResponse } from "@inlang/dashboard/src/lib/types/databaseResponse";
import { database } from "@inlang/dashboard/src/lib/services/database";
import { test_getJson } from "../api";

let translations: DatabaseResponse<definitions["translation"][]>;

type AdapterExport = {
  files: Array<{
    path?: string;
    content?: Object;
  }>; 
} | undefined;

//create object for each locale, object has keys which are locales and values which are (paths, content)

export function exportI18nNext(
  translations: definitions["translation"][]
): AdapterExport {
<<<<<<< HEAD
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
=======
  let test: AdapterExport;
  let exists: boolean;
  
  translations.map((translation) => {
    exists=false;
    for(let x of test?.files ?? []){
      if(  x.path == "/".concat(translation.iso_code)){
        exists=true;
       x.content= new Object({key: translation.key_name, value: translation.text});
        break;
      }
    }
    if(!exists){
      let bla = "/".concat(translation.iso_code);
      test?.files.push( {path: bla, content: new Object({key: translation.key_name, value:translation.text})});
    }
  });
  return test;

>>>>>>> 4b4ad1434be09e383771829eb6b65f20ce2902b4
}

