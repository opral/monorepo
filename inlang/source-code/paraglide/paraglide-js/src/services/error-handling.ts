import type { InlangProject } from "@inlang/sdk"

interface ModuleError extends Error {
	name: string
	module: string
}

export function classifyProjectErrors(errors: ReturnType<InlangProject["errors"]>) {
	const isModuleError = (error: Error): error is ModuleError =>
		error instanceof Error && "name" in error && error.name.includes("Module") && "module" in error

	const [moduleErrors, otherErrors] = split(errors as Error[], isModuleError)

	const isFatalModuleError = (error: ModuleError): error is ModuleError =>
		error.module.includes("plugin")
	const [fatalModuleErrors, nonFatalModuleErrors] = split(moduleErrors, isFatalModuleError)

	const fatalErrors = [...fatalModuleErrors, ...otherErrors]
	const nonFatalErrors = [...nonFatalModuleErrors]

	return { fatalErrors, nonFatalErrors }
}

/**
 * Splits an array into two arrays based on the predicate
 */
function split<T, U extends T>(array: T[], predicate: (value: T) => value is U): [U[], T[]] {
	const result: U[] = []
	const rest: T[] = []
	for (const item of array) {
		if (predicate(item)) {
			result.push(item)
		} else {
			rest.push(item)
		}
	}
	return [result, rest]
}
