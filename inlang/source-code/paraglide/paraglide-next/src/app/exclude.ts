export type ExcludeConfig = (string | RegExp)[]

export function createExclude(excludeConfig: ExcludeConfig): (path: string) => boolean {
	const checks: ((path: string) => boolean)[] = excludeConfig.map((exclude) => {
		return typeof exclude === "string" ? (path) => path === exclude : (path) => exclude.test(path)
	})

	return (path) => checks.some((check) => check(path))
}
