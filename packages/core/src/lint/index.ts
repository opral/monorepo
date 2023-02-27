export { lint } from "./linter.js";
export * from "./query.js";
export { type Context, parseLintConfigArguments } from "./context.js";
export {
  createLintRule,
  type LintRule,
  type LintRuleInitializer,
  type LintRuleId,
} from "./rule.js";
export {
  createLintRuleCollection,
  type RuleCollectionInitializer,
} from "./ruleCollection.js";

// TODO: create helper functions so plugin authors can test their own rules
//		- for correct parameter handling
//		- for correct return type
// TODO: add debug logs

// TODO: documentation
//    - how to use the lint functionality
//    - how to create a rule
//    - how to test a rule
//    - how to publish a rule
