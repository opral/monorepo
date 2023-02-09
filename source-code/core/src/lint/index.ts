export type { LintRule, LintRuleInit } from './schema.js'
export { lint } from './linter.js'
export { parseLintType } from './reporter.js'

// TODO: distinguish between plugin and rule
// TODO: create utility functions to check and get lint issues
// TODO: process rules in parallel to speed things up
