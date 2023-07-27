export type { InlangConfig, InlangConfigModule, DefineConfig } from "./schema.js"
export { setupConfig } from "./setupConfig.js"
export { parseConfig, ParseConfigException } from "./parseConfig.js"
// exporting the message reference match type for higher dx.
// the ide extension config schema can be retrieved by
// `InlangConfig['ideExtension']`
export type { MessageReferenceMatch } from "./ideExtension/schema.js"
