import type { Language } from "@inlang/core/ast"

export type Detector<Parameters extends Array<unknown> = Array<never>> = (
	...parameters: Parameters
) => Array<Language> | ReadonlyArray<Language>

export type DetectorInitializer<Parameters extends Array<unknown> = Array<never>> = (
	...parameters: Parameters
) => Detector<Parameters>
