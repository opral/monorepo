export { lint } from './linter.js'
export * from './query.js'
export { type Reporter, parseLintSettings } from './reporter.js'
export type { ConfiguredLintRule, LintRule } from './rule.js'

// TODO: write actual tests
// TODO: write type definition tests
// TODO: create helper functions so plugin authors can test their own rules
//		- for correct parameter handling
//		- for correct return type
// TODO: add debug logs

// TODO: documentation
//    - how to use the lint functionality
//    - how to create a rule
//    - how to test a rule
//    - how to publish a rule
