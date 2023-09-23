import { expectType } from "tsd"
import * as runtime from "./runtime.js"

// --------- sourceLanguageTag ---------

// it should have a narrow type, not a generic string
expectType<"en">(runtime.sourceLanguageTag)

// --------- languageTags ----------

// it should have a narrow type, not a generic string
expectType<Readonly<Array<"de" | "en">>>(runtime.languageTags)

// --------- setLanguageTag() ---------

// @ts-expect-error - should not be possible to set the language tag to a language tags that is not included in languageTags
runtime.setLanguageTag("fr")

// it should be possible to set the language tag to a language tag that is included in languageTags
runtime.setLanguageTag("de")

// --------- languageTag() ---------

// it should return the available language tags, not a generic string
expectType<"en" | "de">(runtime.languageTag())
