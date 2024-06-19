import { type InlangProject, ModuleError } from "@inlang/sdk"

export function classifyProjectErrors(errors: ReturnType<InlangProject["errors"]>) {
	const isModuleError = (err: Error): err is ModuleError => err instanceof ModuleError
	const [moduleErrors, otherErrors] = split(errors as Error[], isModuleError)

	const isFatalModuleError = (err: ModuleError): err is ModuleError => err.module.includes("plugin")
	const [fatalModuleErrors, nonFatalModuleErrors] = split(moduleErrors, isFatalModuleError)

	const fatalErrors = [...fatalModuleErrors, ...otherErrors]
	const nonFatalErrors = [...nonFatalModuleErrors]

	return { fatalErrors, nonFatalErrors }
}

/**
 * Splits an array into two arrays based on the predicate
 */
export function split<T, U extends T>(array: T[], predicate: (value: T) => value is U): [U[], T[]] {
	const mask = array.map(predicate)
	const result = array.filter((_, index) => mask[index]) as U[]
	const rest = array.filter((_, index) => !mask[index]) as T[]
	return [result, rest]
}
