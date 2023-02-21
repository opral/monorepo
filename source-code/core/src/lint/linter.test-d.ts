import { expectType } from 'tsd';
import type { Config, EnvironmentFunctions } from '../config/schema.js';
import type { LintedResource } from './context.js';
import { lint } from './linter.js';

// eslint-disable-next-line unicorn/no-null
const config: Config = null as any
// eslint-disable-next-line unicorn/no-null
const env: EnvironmentFunctions = null as any

expectType<Parameters<typeof lint>[0]>(config)
expectType<Parameters<typeof lint>[1]>(env)

expectType<LintedResource[] | undefined>(await lint(config, env))
