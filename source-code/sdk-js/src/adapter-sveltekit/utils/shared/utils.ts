import type { Language } from '@inlang/core/ast'
import type { LoadEvent } from '@sveltejs/kit'
import type { RelativeUrl } from '../../../core/index.js'
import type { SvelteKitClientRuntime } from '../client/runtime.js'

export const inlangSymbol = Symbol.for("inlang")

// ------------------------------------------------------------------------------------------------

export type DataWithRuntime<Data extends Record<string, unknown> | void> = Data & {
	[inlangSymbol]: SvelteKitClientRuntime
}

export const addRuntimeToData = <Data extends Record<string, unknown> | void>(data: Data, runtime: SvelteKitClientRuntime): DataWithRuntime<Data> =>
	({ ...(data || {} as Data), [inlangSymbol]: runtime })

export const getRuntimeFromData = <Data extends Record<string, unknown> | void>(data: DataWithRuntime<Data>) => data[inlangSymbol]

// ------------------------------------------------------------------------------------------------

export type EventWithRuntimePromise<Event extends LoadEvent> = Event & {
	params: { [inlangSymbol]: Promise<SvelteKitClientRuntime> }
}

export const addRuntimePromiseToEvent = <Event extends LoadEvent>(event: Event, runtimePromise: Promise<SvelteKitClientRuntime>): EventWithRuntimePromise<Event> => {
	(event as EventWithRuntimePromise<Event>).params[inlangSymbol] = runtimePromise

	return event as EventWithRuntimePromise<Event>
}

export const getRuntimePromiseFromEvent = <Event extends LoadEvent>(event: EventWithRuntimePromise<Event>): Promise<SvelteKitClientRuntime> => event.params[inlangSymbol]

// ------------------------------------------------------------------------------------------------

export const replaceLanguageInUrl = (url: URL, language: Language) =>
	new URL(
		`${url.origin}${replaceLanguageInSlug(url.pathname as RelativeUrl, language)}${url.search}${url.hash
		}`,
	)

const replaceLanguageInSlug = (pathname: RelativeUrl, language: Language) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_, __, ...path] = pathname.split("/")

	return `/${language}${path.length ? `/${path.join("/")}` : ''}`
}
