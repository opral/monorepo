import type { Resource } from "@inlang/core/ast"
import type * as Ast from "@inlang/core/ast"
import {
	InlangFunctionBaseArgs,
	createInlangFunction,
	InlangFunction,
	InlangString,
} from "./inlang-function.js"

export const isAsync = <T>(p: unknown): p is Promise<T> =>
	!!p && typeof p === "object" && typeof (p as Promise<T>).then === "function"

const fallbackInlangFunction: InlangFunction = () => "" as InlangString

type MaybePromise<T> = T | Promise<T>

export type RuntimeContext<
	Language extends Ast.Language = Ast.Language,
	ReadResourcesMaybePromise extends
		| (Ast.Resource | undefined)
		| Promise<Ast.Resource | undefined> = MaybePromise<Resource | undefined>,
> = {
	readResource: (language: Language) => ReadResourcesMaybePromise
}

export type RuntimeState<Language extends Ast.Language = Ast.Language> = {
	resources: Map<Language, Ast.Resource>
	language: Language | undefined
	i: InlangFunction<any> | undefined
}

export const initRuntime = <
	Language extends Ast.Language,
	ReadResourcesMaybePromise extends (Ast.Resource | undefined) | Promise<Ast.Resource | undefined>,
	InlangFunctionArgs extends InlangFunctionBaseArgs = InlangFunctionBaseArgs,
>(
	context: RuntimeContext<Language, ReadResourcesMaybePromise>,
) => initBaseRuntime<Language, ReadResourcesMaybePromise, InlangFunctionArgs>(context)

export type Runtime = ReturnType<typeof initRuntime>

export const initBaseRuntime = <
	Language extends Ast.Language,
	ReadResourcesMaybePromise extends (Ast.Resource | undefined) | Promise<Ast.Resource | undefined>,
	InlangFunctionArgs extends InlangFunctionBaseArgs = InlangFunctionBaseArgs,
>(
	{ readResource }: RuntimeContext<Language, ReadResourcesMaybePromise>,
	state: RuntimeState<Language> = {
		resources: new Map(),
		language: undefined,
		i: undefined,
	},
) => {
	const loadResourcePromises = new Map<Language, ReadResourcesMaybePromise>()
	let isLoadResourceFunctionAsync = false

	const loadResource = (language: Language): ReadResourcesMaybePromise => {
		if (state.resources.has(language))
			return isLoadResourceFunctionAsync
				? (Promise.resolve() as ReadResourcesMaybePromise)
				: (undefined as ReadResourcesMaybePromise)

		if (loadResourcePromises.has(language))
			return loadResourcePromises.get(language) as ReadResourcesMaybePromise

		const setResource = (resource: Resource | undefined) =>
			resource && state.resources.set(language, resource)

		const resourceMaybePromise = readResource(language)
		if (!isAsync(resourceMaybePromise)) {
			setResource(resourceMaybePromise)
			return undefined as ReadResourcesMaybePromise
		}

		isLoadResourceFunctionAsync = true

		// eslint-disable-next-line no-async-promise-executor
		const promise = new Promise<void>(async (resolve) => {
			const resource = await resourceMaybePromise
			setResource(resource as Resource | undefined)

			loadResourcePromises.delete(language)
			resolve()
		}) as ReadResourcesMaybePromise

		loadResourcePromises.set(language, promise)

		return promise
	}

	const switchLanguage = (language: Language) => {
		state.language = language
		state.i = undefined
	}

	const getLanguage = () => state.language

	const getInlangFunction = () => {
		if (state.i) return state.i

		const resource = state.resources.get(state.language as Language)
		if (!resource) return fallbackInlangFunction

		return (state.i = createInlangFunction<InlangFunctionArgs>(resource))
	}

	return {
		loadResource,
		switchLanguage,
		get language() {
			return getLanguage()
		},
		get i() {
			return getInlangFunction()
		},
	}
}

export const initRuntimeWithLanguageInformation = <
	Language extends Ast.Language,
	ReadResourcesMaybePromise extends (Ast.Resource | undefined) | Promise<Ast.Resource | undefined>,
	InlangFunctionArgs extends InlangFunctionBaseArgs = InlangFunctionBaseArgs,
>(
	context: RuntimeContext<Language, ReadResourcesMaybePromise> & {
		referenceLanguage: Language
		languages: Language[]
	},
) => {
	const runtime = initBaseRuntime<Language, ReadResourcesMaybePromise, InlangFunctionArgs>(context)

	return {
		...runtime,
		get language() {
			return runtime.language
		},
		get i() {
			return runtime.i
		},
		get referenceLanguage() {
			return context.referenceLanguage
		},
		get languages() {
			return context.languages
		},
	}
}
