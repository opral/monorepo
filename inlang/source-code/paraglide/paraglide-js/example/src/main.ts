/* eslint-disable no-undef */
/* eslint-disable no-console */
import * as m from "./paraglide/messages.js"
import * as en_US from "./paraglide/messages/en.js"
import { languageTag, setLanguageTag } from "./paraglide/runtime.js"

setLanguageTag("en")

console.log(m.currentLanguageTag({ languageTag: languageTag() }))
console.log(m.greeting({ name: "Samuel", count: 0 }))

setLanguageTag("de")

console.log(m.currentLanguageTag({ languageTag: languageTag() }))
console.log(m.greeting({ name: "Samuel", count: 5 }))

console.log(en_US.greeting({ name: "Samuel", count: 5 }))

console.log(m.missing_in_german())
