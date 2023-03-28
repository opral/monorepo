import type { Resource } from "@inlang/core/ast"
import { createLookupFunction } from "./lookup-function.js"

const resource = {} as Resource

// ------------------------------------------------------------------------------------------------

{
	const i = createLookupFunction(resource)

	i("hello")
	i("welcome")
	i("welcome", { name: "Inlang" })
}

// ------------------------------------------------------------------------------------------------

{
	const i = createLookupFunction<{
		hello: never
		welcome: { name: string }
	}>(resource)

	i("hello")
	// @ts-expect-error does not accept args
	i("hello", { world: "!!" })
	// @ts-expect-error does expect args
	i("welcome")
	i("welcome", { name: "Inlang" })
	// @ts-expect-error args must match
	i("welcome", { arg: "home" })
}
