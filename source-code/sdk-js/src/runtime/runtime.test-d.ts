import type { Resource } from '@inlang/core/ast'
import { expectType } from "tsd"
import { initRuntime, RuntimeContext } from "./runtime.js"

// ------------------------------------------------------------------------------------------------

const context: RuntimeContext<string, Promise<Resource | undefined>> = {
	readResource: () => Promise.resolve(undefined),
}

{
	const runtime = initRuntime(context)

	runtime.loadResource("")
	runtime.loadResource("en")
	runtime.loadResource("test-1234")

	runtime.switchLanguage("")
	runtime.switchLanguage("en")
	runtime.switchLanguage("test-1234")

	expectType<(typeof runtime)["language"]>("")
	expectType<(typeof runtime)["language"]>("test")

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

	// @ts-expect-error must be a valid language
	runtime.loadResource("")
	runtime.loadResource("en")
	// @ts-expect-error must be a valid language
	runtime.loadResource("test-1234")

	// @ts-expect-error must be a valid language
	runtime.switchLanguage("")
	runtime.switchLanguage("en")
	// @ts-expect-error must be a valid language
	runtime.switchLanguage("test-1234")

	expectType<(typeof runtime)["language"]>("de")
	expectType<(typeof runtime)["language"]>("en")
	// @ts-expect-error must be a valid language
	expectType<(typeof runtime)["language"]>("test")

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
