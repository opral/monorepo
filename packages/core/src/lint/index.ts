export { lint } from './linter.js'
export * from './query.js'
export { type Context, parseLintSettings } from './context.js'
export { createRule, type ConfiguredLintRule, type LintRule, type LintRuleId } from './rule.js'
export { createRuleCollection, type RuleCollection } from './ruleCollection.js'

// TODO: create helper functions so plugin authors can test their own rules
//		- for correct parameter handling
//		- for correct return type
// TODO: add debug logs

// TODO: documentation
//    - how to use the lint functionality
//    - how to create a rule
//    - how to test a rule
//    - how to publish a rule

// TODO: decide on naming
// `createRule` or `createLintRule`
// `createCollection` or `createLintCollection`
// `LintRule` => `ConfiguredLintRule` or `LintRuleInitializer` => `LintRule`
// `Args`, `Options`, `Settings`, `Params` ...
//