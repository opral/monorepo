import type { Language } from "@inlang/core/ast"

type MaybePromise<T> = T | Promise<T>

export type Detector<Parameters extends Array<unknown> = Array<never>> = (
	...parameters: Parameters
) => MaybePromise<Array<Language> | ReadonlyArray<Language>>

export type DetectorInitializer<Parameters extends Array<unknown> = Array<never>> = (
	...parameters: Parameters
) => Detector<Parameters>
