import type { Resource } from "@inlang/core/ast"
import type * as Ast from "@inlang/core/ast"
import {
	type InlangFunctionBaseArgs,
	createInlangFunction,
	type InlangFunction,
	type InlangString,
} from "./inlang-function.js"
import type { LanguageTag } from '@inlang/core/languageTag'
import { logDeprecation } from '../utils.js'

export const isAsync = <T>(p: unknown): p is Promise<T> =>
	!!p && typeof p === "object" && typeof (p as Promise<T>).then === "function"

const fallbackInlangFunction: InlangFunction = () => "" as InlangString

type MaybePromise<T> = T | Promise<T>

export type RuntimeContext<
	LanguageTag extends LanguageTag = LanguageTag,
	ReadResourcesMaybePromise extends
	| (Ast.Resource | undefined)
	| Promise<Ast.Resource | undefined> = MaybePromise<Resource | undefined>,
> = {
		readResource: (languageTag: LanguageTag) => ReadResourcesMaybePromise
}

export type RuntimeState<LanguageTag extends LanguageTag = LanguageTag> = {
	resources: Map<LanguageTag, Ast.Resource>
	languageTag: LanguageTag | undefined
	i: InlangFunction<any> | undefined
}

export const initRuntime = <
	LanguageTag extends LanguageTag,
	ReadResourcesMaybePromise extends (Ast.Resource | undefined) | Promise<Ast.Resource | undefined>,
	InlangFunctionArgs extends InlangFunctionBaseArgs = InlangFunctionBaseArgs,
>(
	context: RuntimeContext<LanguageTag, ReadResourcesMaybePromise>,
) => initBaseRuntime<LanguageTag, ReadResourcesMaybePromise, InlangFunctionArgs>(context)

export type Runtime = ReturnType<typeof initRuntime>

export const initBaseRuntime = <
	LanguageTag extends LanguageTag,
	ReadResourcesMaybePromise extends (Ast.Resource | undefined) | Promise<Ast.Resource | undefined>,
	InlangFunctionArgs extends InlangFunctionBaseArgs = InlangFunctionBaseArgs,
>(
	{ readResource }: RuntimeContext<LanguageTag, ReadResourcesMaybePromise>,
	state: RuntimeState<LanguageTag> = {
		resources: new Map(),
		languageTag: undefined,
		i: undefined,
	},
) => {
	const loadResourcePromises = new Map<LanguageTag, ReadResourcesMaybePromise>()
	let isLoadResourceFunctionAsync = false

	const loadResource = (languageTag: LanguageTag): ReadResourcesMaybePromise => {
		if (state.resources.has(languageTag))
			return isLoadResourceFunctionAsync
				? (Promise.resolve() as ReadResourcesMaybePromise)
				: (undefined as ReadResourcesMaybePromise)

		if (loadResourcePromises.has(languageTag))
			return loadResourcePromises.get(languageTag) as ReadResourcesMaybePromise

		const setResource = (resource: Resource | undefined) =>
			resource && state.resources.set(languageTag, resource)

		const resourceMaybePromise = readResource(languageTag)
		if (!isAsync(resourceMaybePromise)) {
			setResource(resourceMaybePromise)
			return undefined as ReadResourcesMaybePromise
		}

		isLoadResourceFunctionAsync = true

		// eslint-disable-next-line no-async-promise-executor
		const promise = new Promise<void>(async (resolve) => {
			const resource = await resourceMaybePromise
			setResource(resource as Resource | undefined)

			loadResourcePromises.delete(languageTag)
			resolve()
		}) as ReadResourcesMaybePromise

		loadResourcePromises.set(languageTag, promise)

		return promise
	}

	const changeLanguageTag = (languageTag: LanguageTag) => {
		state.languageTag = languageTag
		state.i = undefined
	}

	const getInlangFunction = () => {
		if (state.i) return state.i

		const resource = state.resources.get(state.languageTag as LanguageTag)
		if (!resource) return fallbackInlangFunction

		return (state.i = createInlangFunction<InlangFunctionArgs>(resource))
	}

	return {
		loadResource,
		changeLanguageTag,
		get languageTag() {
			return state.languageTag
		},
		get i() {
			return getInlangFunction()
		},
		/** @deprecated Use `changeLanguageTag` instead. */
		switchLanguage: (...args: Parameters<typeof changeLanguageTag>) => {
			logDeprecation('switchLanguage', 'changeLanguageTag')
			return changeLanguageTag(...args)
		},
		/** @deprecated Use `languageTag` instead. */
		get language() {
			logDeprecation('language', 'languageTag')
			return this.languageTag
		},
	}
}

export const initRuntimeWithLanguageInformation = <
	LanguageTag extends LanguageTag,
	ReadResourcesMaybePromise extends (Ast.Resource | undefined) | Promise<Ast.Resource | undefined>,
	InlangFunctionArgs extends InlangFunctionBaseArgs = InlangFunctionBaseArgs,
>(
	context: RuntimeContext<LanguageTag, ReadResourcesMaybePromise> & {
		sourceLanguageTag: LanguageTag
		languageTags: LanguageTag[]
	},
) => {
	const runtime = initBaseRuntime<LanguageTag, ReadResourcesMaybePromise, InlangFunctionArgs>(context)

	return {
		...runtime,
		get languageTag() {
			return runtime.languageTag
		},
		get i() {
			return runtime.i
		},
		get sourceLanguageTag() {
			return context.sourceLanguageTag
		},
		get languageTags() {
			return context.languageTags
		},
		/** @deprecated Use `languageTag` instead. */
		get language(): LanguageTag | undefined {
			return this.languageTag
		},
		/** @deprecated Use `sourceLanguageTag` instead. */
		get referenceLanguage(): LanguageTag {
			logDeprecation('referenceLanguage', 'sourceLanguageTag')
			return this.sourceLanguageTag
		},
		/** @deprecated Use `languageTags` instead. */
		get languages(): LanguageTag[] {
			logDeprecation('languages', 'languageTags')
			return this.languageTags
		},
	}
}
