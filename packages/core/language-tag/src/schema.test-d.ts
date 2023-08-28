import type { LanguageTag, Translatable } from "./schema.js"
import { expectType } from "tsd"

const tag: LanguageTag = "en"

const translations: Translatable<string> = {
	en: "Hello world",
	de: "Hallo Welt",
}

expectType<LanguageTag>(tag)
expectType<Translatable<string>>(translations)

expectType<string | undefined>(translations[tag])

expectType<string>(translations[tag] ?? translations.en)
