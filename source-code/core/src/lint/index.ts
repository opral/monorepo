export type { LintRuleInit } from './schema.js'
export { lint } from './linter.js'
export { type Reporter, parseLintSettings } from './reporter.js'
export type { LintRule } from './rule.js'

// TODO: distinguish between plugin and rule
// TODO: add `createRuleCollection` utility function

// TODO: create utility functions to check and get lint issues
// TODO: process rules in parallel to speed things up
// TODO: add debug logs
