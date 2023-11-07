/* eslint-disable no-undef */
/* eslint-disable no-console */
import * as m from "./paraglide-js/messages"
import { languageTag, setLanguageTag } from "./paraglide-js/runtime"

setLanguageTag("en")

console.log(m.currentLanguageTag({ languageTag: languageTag() }))
console.log(m.greeting({ name: "Samuel", count: 5 }))

setLanguageTag("de")

console.log(m.currentLanguageTag({ languageTag: languageTag() }))
console.log(m.greeting({ name: "Samuel", count: 5 }))
