import { normalize } from "./utils/path.js"

export type ExcludeConfig = (string | RegExp)[]

export function createExclude(excludeConfig: ExcludeConfig): (path: string) => boolean {
	const checks: ((path: string) => boolean)[] = []

	for (const exclude of excludeConfig) {
		if (typeof exclude === "string") {
			checks.push((path) => path === exclude)
		} else {
			checks.push((path) => exclude.test(path))
		}
	}

	return (path) => {
		path = normalize(path)
		return checks.some((check) => check(path))
	}
}
