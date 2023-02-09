export type { LintRule, LintRuleInit } from './schema.js'
export { lint } from './linter.js'

// TODO: distinguish between plugin and rule
// TODO: create utility functions to check and get lint issues
// TODO: allow to set lint type
// TODO: allow to disable lint rule
// TODO: process rules in parallel to speed things up
