import { createInlangFunction } from "./inlang-function.js"
import type { Message } from "@inlang/sdk"

const messages = [] as Message[]

// ------------------------------------------------------------------------------------------------

{
	const i = createInlangFunction(messages, "en")

	i("hello")
	i("welcome")
	i("welcome", { name: "Inlang" })
}

// ------------------------------------------------------------------------------------------------

{
	const i = createInlangFunction<{
		hello: never
		welcome: { name: string }
	}>(messages, "en")

	i("hello")
	// @ts-expect-error does not accept args
	i("hello", { world: "!!" })
	// @ts-expect-error does expect args
	i("welcome")
	i("welcome", { name: "Inlang" })
	// @ts-expect-error args must match
	i("welcome", { arg: "home" })
}
