/* eslint-disable no-undef */
/* eslint-disable no-console */
import * as m from "@inlang/paraglide-js/messages"
import { languageTag, changeLanguageTag } from "@inlang/paraglide-js"

changeLanguageTag("en")

console.log(m.currentLanguageTag({ languageTag }))
console.log(m.greeting({ name: "Samuel", count: 5 }))

changeLanguageTag("de")

console.log(m.currentLanguageTag({ languageTag }))
console.log(m.greeting({ name: "Samuel", count: 5 }))
