import type { BCP47LanguageTag } from '@inlang/core/languageTag'

type MaybePromise<T> = T | Promise<T>

export type Detector<Parameters extends Array<unknown> = Array<never>> = (
	...parameters: Parameters
) => MaybePromise<BCP47LanguageTag[]>

export type DetectorInitializer<Parameters extends Array<unknown> = Array<never>> = (
	...parameters: Parameters
) => Detector<Parameters>
