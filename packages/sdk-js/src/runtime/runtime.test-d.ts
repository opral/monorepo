import type { Resource } from "@inlang/core/ast"
import { expectType } from "tsd"
import { initRuntime, type RuntimeContext } from "./runtime.js"

// ------------------------------------------------------------------------------------------------

const context: RuntimeContext<string, Promise<Resource | undefined>> = {
	readResource: () => Promise.resolve(undefined),
}

{
	const runtime = initRuntime(context)

	runtime.loadResource("")
	runtime.loadResource("en")
	runtime.loadResource("test-1234")

	runtime.changeLanguageTag("")
	runtime.changeLanguageTag("en")
	runtime.changeLanguageTag("test-1234")

	expectType<(typeof runtime)["languageTag"]>("")
	expectType<(typeof runtime)["languageTag"]>("test")

	const i = runtime.i

	i("hello")
	i("welcome")
	i("welcome", { name: "Inlang" })
}

// ------------------------------------------------------------------------------------------------

{
	const runtime = initRuntime<
		"de" | "en",
		Promise<Resource | undefined>,
		{
			hello: never
			welcome: { name: string }
		}
	>(context)

	// @ts-expect-error must be a valid languageTag
	runtime.loadResource("")
	runtime.loadResource("en")
	// @ts-expect-error must be a valid languageTag
	runtime.loadResource("test-1234")

	// @ts-expect-error must be a valid languageTag
	runtime.changeLanguageTag("")
	runtime.changeLanguageTag("en")
	// @ts-expect-error must be a valid languageTag
	runtime.changeLanguageTag("test-1234")

	expectType<(typeof runtime)["languageTag"]>("de")
	expectType<(typeof runtime)["languageTag"]>("en")
	// @ts-expect-error must be a valid languageTag
	expectType<(typeof runtime)["languageTag"]>("test")

	const i = runtime.i

	i("hello")
	// @ts-expect-error does not accept args
	i("hello", { world: "!!" })
	// @ts-expect-error does expect args
	i("welcome")
	i("welcome", { name: "Inlang" })
	// @ts-expect-error args must match
	i("welcome", { arg: "home" })
}
