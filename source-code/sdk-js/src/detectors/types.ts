import type { BCP47LanguageTag } from '@inlang/core/languageTag'

type MaybePromise<T> = T | Promise<T>

export type Detector<Parameters extends unknown[] = never[]> = (
	...parameters: Parameters
) => MaybePromise<BCP47LanguageTag[]>

export type DetectorInitializer<Parameters extends unknown[] = never[]> = (
	...parameters: Parameters
) => Detector<Parameters>
