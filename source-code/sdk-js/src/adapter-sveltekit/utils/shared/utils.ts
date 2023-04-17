import type { Language } from '@inlang/core/ast'
import type { RelativeUrl } from '../../../core/index.js'
import type { SvelteKitClientRuntime } from '../client/runtime.js'

export const inlangSymbol = Symbol.for("inlang")

export const addRuntimeToData = <Data extends Record<string, unknown> | void>(data: Data, runtime: SvelteKitClientRuntime): Data & { [inlangSymbol]: SvelteKitClientRuntime } =>
	({ ...(data || {} as Data), [inlangSymbol]: runtime })

export const getRuntimeFromData = (data: { [inlangSymbol]: SvelteKitClientRuntime }) => data[inlangSymbol]

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
