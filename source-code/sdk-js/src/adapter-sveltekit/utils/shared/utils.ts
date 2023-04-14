import type { RelativeUrl } from '../../../core/index.js'
import type { SvelteKitClientRuntime } from '../client/runtime.js'

export const inlangSymbol = Symbol.for("inlang")

export const setRuntimeToData = <Data extends Record<string, unknown> | null>(data: Data, runtime: SvelteKitClientRuntime): Data & { [inlangSymbol]: SvelteKitClientRuntime } =>
	({ ...(data || {} as Data), [inlangSymbol]: runtime })

export const getRuntimeFromData = (data: { [inlangSymbol]: SvelteKitClientRuntime }) => data[inlangSymbol]

// ------------------------------------------------------------------------------------------------

export const replaceLanguageInUrl = (url: URL, language: string) =>
	new URL(
		`${url.origin}${replaceLanguageInSlug(url.pathname as RelativeUrl, language)}${url.search}${url.hash
		}`,
	)

const replaceLanguageInSlug = (pathname: RelativeUrl, language: string) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_, __, ...path] = pathname.split("/")
	return `/${language}/${path.join("/")}`
}