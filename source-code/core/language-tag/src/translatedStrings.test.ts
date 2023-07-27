import { expectType } from "tsd"
import { TranslatedStrings } from "./translatedStrings.js"

// the zod schema must be identical to the types
expectType<TranslatedStrings>(TranslatedStrings.parse({} as any))
