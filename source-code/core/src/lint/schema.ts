import type { Config } from '../config/schema.js'

type MaybePromise<T> = T | Promise<T>

type LintLevel = 'error' | 'warning'

type LintConfig<Config = Record<string, unknown>> = {
	[Key in keyof Config]?: false | LintLevel | Config[Key]
}

export type LintRuleInit<Config extends Record<string, unknown> | undefined = undefined> =
	(...options: [undefined extends Config ? never : LintConfig<Config>]) => LintRule

export type LintRule = {
	id: string
	initialize?: (config: Pick<Config, 'referenceLanguage' | 'languages'>) => MaybePromise<unknown>
}