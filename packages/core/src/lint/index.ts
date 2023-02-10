export { lint } from './linter.js'
export * from './query.js'
export { type Reporter, parseLintSettings } from './reporter.js'
export type { LintRule, LintRuleInit } from './rule.js'

// TODO: distinguish between plugin and rule
// TODO: add `createRuleCollection` utility function

// TODO: add debug logs
