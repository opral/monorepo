import { expectType } from "tsd"
import type { Config } from "../config/schema.js"
import type { LintedResource } from "./context.js"
import type * as ast from "../ast/index.js"
import { lint } from "./linter.js"

const config: Config = undefined as any
const resources: ast.Resource[] = undefined as any

expectType<Parameters<typeof lint>[0]["config"]>(config)

expectType<LintedResource[] | undefined>(await lint({ config, resources }))
