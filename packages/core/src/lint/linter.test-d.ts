/* eslint-disable unicorn/no-null */
import { expectType } from "tsd"
import type { Config, EnvironmentFunctions } from "../config/schema.js"
import type { LintedResource } from "./context.js"
import { lint } from "./linter.js"

const config: Config = null as any
const env: EnvironmentFunctions = null as any

expectType<Parameters<typeof lint>[0]>(config)
expectType<Parameters<typeof lint>[1]>(env)

expectType<LintedResource[] | undefined>(await lint(config, env))
