/* eslint-disable no-undef */
/* eslint-disable no-console */
import * as m from "@inlang/paraglide-js/messages"
import { languageTag, setLanguageTag } from "@inlang/paraglide-js"

setLanguageTag("en")

console.log(m.currentLanguageTag({ languageTag }))
console.log(m.greeting({ name: "Samuel", count: 5 }))

setLanguageTag("de")

console.log(m.currentLanguageTag({ languageTag }))
console.log(m.greeting({ name: "Samuel", count: 5 }))
