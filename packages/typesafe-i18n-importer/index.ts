import { database } from "./database";
import type { definitions } from "@inlang/database";
import { storeTranslationsToDisk } from "typesafe-i18n/importer";
import type { Locale, BaseTranslation } from "typesafe-i18n/types/core";
import { isEqual } from "lodash";

type LocaleMapping = { locale: Locale; translations: BaseTranslation };

let projectId = "";
import("../inlang.json")
  .then((config) => {
    if (config !== undefined) {
      projectId = config.projectId;
    } else {
      throw new Error("projectId not supplied in inlang.json.");
    }
  })
  .catch((error) => {
    throw new Error(error);
  });
let lastLocaleMappingList: LocaleMapping[] = [];

const getDataFromDatabase = async () => {
  return database
    .from<definitions["translation"]>("translation")
    .select("*")
    .eq("project_id", projectId);
};

// Recursive function as it is assumed that namespace is not deep enough to cause stack overflow.
const createNestedObject = (
  base: BaseTranslation,
  names: string[],
  text: string
) => {
  if (names.length === 1) {
    base[names[0]] = text;
  } else {
    if (base[names[0]] === undefined) {
      base[names[0]] = {};
    }
    base[names[0]] = createNestedObject(
      base[names[0]] as BaseTranslation,
      names.slice(1),
      text
    );
  }
  return base;
};

const updateTranslations = async () => {
  const translations = await getDataFromDatabase();

  const localeMappingList: LocaleMapping[] = [];

  for (const t of translations.data ?? []) {
    let localeMapping = localeMappingList.find((l) => l.locale === t.iso_code);
    if (localeMapping === undefined) {
      localeMappingList.push({ locale: t.iso_code, translations: {} });
      localeMapping = localeMappingList[localeMappingList.length - 1];
    }
    const nest = t.key_name.split(".");
    localeMapping.translations = createNestedObject(
      localeMapping.translations,
      nest,
      t.text
    );
  }
  if (isEqual(localeMappingList, lastLocaleMappingList) === false) {
    await storeTranslationsToDisk(localeMappingList);
    lastLocaleMappingList = localeMappingList;
  }
};

setInterval(() => {
  updateTranslations();
}, 2000);
