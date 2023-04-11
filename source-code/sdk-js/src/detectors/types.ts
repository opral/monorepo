import type { Language } from "@inlang/core/ast"

export type Detector = () => Language[] | Language | undefined

export type InitDetector<Parameters extends Array<unknown>> = (
	...parameters: Parameters
) => Detector

export type DetectorTemplate<Parameters extends Array<unknown>> = (
	...parameters: Parameters
) => ReturnType<Detector>
