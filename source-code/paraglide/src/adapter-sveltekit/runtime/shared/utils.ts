import type { LoadEvent } from "@sveltejs/kit"
import type { RelativeUrl } from "../../../index.js"
import type { SvelteKitClientRuntime } from "../client/runtime.js"
import type { LanguageTag } from "@inlang/sdk"

export const inlangSymbol = Symbol.for("inlang")

// ------------------------------------------------------------------------------------------------

export type ObjectWithClientRuntime<
	Data extends Record<string, unknown> | void = Record<string, unknown>,
> = Data & {
	[inlangSymbol]: SvelteKitClientRuntime
}

export const addRuntimeToData = <Data extends Record<string, unknown>>(
	data: Data,
	runtime: SvelteKitClientRuntime,
): ObjectWithClientRuntime<Data> => ({ ...(data || ({} as Data)), [inlangSymbol]: runtime })

export const getRuntimeFromData = <Data extends Record<string, unknown>>(
	data: ObjectWithClientRuntime<Data>,
) => data[inlangSymbol]

// ------------------------------------------------------------------------------------------------

// ! this is currently the only way to share data between all load functions

export type EventWithRuntimePromise<Event extends LoadEvent> = Event & {
	params: { [inlangSymbol]: Promise<SvelteKitClientRuntime> }
}

export const addRuntimePromiseToEvent = <Event extends LoadEvent>(
	event: Event,
	runtimePromise: Promise<SvelteKitClientRuntime>,
): EventWithRuntimePromise<Event> => {
	;(event as EventWithRuntimePromise<Event>).params[inlangSymbol] = runtimePromise

	return event as EventWithRuntimePromise<Event>
}

export const getRuntimePromiseFromEvent = <Event extends LoadEvent>(
	event: EventWithRuntimePromise<Event>,
): Promise<SvelteKitClientRuntime> => event.params[inlangSymbol]

// ------------------------------------------------------------------------------------------------

export const replaceLanguageInUrl = (url: URL, languageTag: LanguageTag) =>
	new URL(
		`${url.origin}${replaceLanguageInSlug(url.pathname as RelativeUrl, languageTag)}${url.search}${
			url.hash
		}`,
	)

const replaceLanguageInSlug = (pathname: RelativeUrl, languageTag: LanguageTag) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_, __, ...path] = pathname.split("/")

	return `/${languageTag}${path.length ? `/${path.join("/")}` : ""}`
}

// ------------------------------------------------------------------------------------------------

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
