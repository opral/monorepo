/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Translatable } from "./interface.js";
import { expectType } from "tsd";

const tag: string = "en";

/**
 * --------------------- INCREMENTALLY ADOPTABLE ---------------------
 *
 * Translatable should be incrementally adoptable.
 * Hence, it should be possible to define a Type
 * that is later changed to Translatable<Type>
 * without breaking current code.
 */

const value = "Hello world";
const incrementallyAdoptable: Translatable<string> = value;

// a translatable coming from an external source
// is unknown whether the type is a string or a Translatable<string>
const externalTranslatable: Translatable<string> = "" as any;

// @ts-expect-error - unknown whether external translatable is a string
expectType<string>(externalTranslatable);

// @ts-expect-error - unknown whether external translatable is a record
expectType<Translatable<string>>(externalTranslatable.en);

typeof externalTranslatable === "string" &&
  expectType<string>(externalTranslatable);
typeof externalTranslatable === "object" &&
  expectType<string>(externalTranslatable.en);
typeof externalTranslatable === "object" &&
  expectType<string | undefined>(externalTranslatable[tag]);
typeof externalTranslatable === "object" &&
  expectType<string>(externalTranslatable[tag] ?? externalTranslatable.en);

const val =
  typeof externalTranslatable === "object"
    ? (externalTranslatable[tag] ?? externalTranslatable.en)
    : externalTranslatable;

// --------------------- TESTING A TRANSLATABLE<T extends not String> ---------------------
// Translatable v1.0 only supports strings. Upon user requests, we might add support for
// other types in the future. This test ensures that the type is not yet supported.

// @ts-expect-error - Translatable<T> requires T to be a string for now
let translationsObject: Translatable<{ foo: string }>;
// @ts-expect-error - Translatable<T> requires T to be a string for now
let translatableArray: Translatable<string[]>;

/**
 * --------------------- TRANSLATABLE<TYPE> USAGE TEST ---------------------
 */

const translations: Translatable<string> = {
  en: "Hello world",
  de: "Hallo Welt",
};

expectType<string>(translations.en);
expectType<Translatable<string>>(translations);
expectType<string | undefined>(translations[tag]);
expectType<string>(translations[tag] ?? translations.en);

/**
 * --------------------- TYPE USAGE TEST ---------------------
 */

const value2: Translatable<string> = "Hello world";

expectType<string>(value2);
expectType<Translatable<string>>(value2);
// @ts-expect-error - value2 is a string
value2[tag];
// @ts-expect-error - value2 is a string
translations[tag] ?? value2.en;
