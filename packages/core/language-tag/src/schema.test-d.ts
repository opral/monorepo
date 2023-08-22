import type { LanguageTag, WithLanguageTags } from "./schema.js"
import { expectType } from "tsd"

const tag: LanguageTag = "en"

const translations: WithLanguageTags<string> = {
	en: "Hello world",
	de: "Hallo Welt",
}

expectType<LanguageTag>(tag)
expectType<WithLanguageTags<string>>(translations)

expectType<string | undefined>(translations[tag])

expectType<string>(translations[tag] ?? translations.en)
