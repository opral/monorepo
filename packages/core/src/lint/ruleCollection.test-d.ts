import { expectType } from "tsd";
import type { LintRule, LintRuleInitializer } from "./rule.js";
import { createLintRuleCollection } from "./ruleCollection.js";

// eslint-disable-next-line unicorn/no-null
const rule: LintRuleInitializer = null as any;
// eslint-disable-next-line unicorn/no-null
const ruleWIthSettings: LintRuleInitializer<{
  some: { nested: "setting" };
  setting: boolean;
}> = null as any;

const ruleCollection = createLintRuleCollection({ rule, ruleWIthSettings });

// parameters -----------------------------------------------------------------

expectType<Parameters<typeof createLintRuleCollection>[0]>({ rule });

expectType<Parameters<typeof ruleCollection>[0]>({ rule: "error" });
expectType<Parameters<typeof ruleCollection>[0]>({ rule: false });
expectType<Parameters<typeof ruleCollection>[0]>({ rule: "warn" });
// @ts-expect-error 'warning' is no valid LintLevel
expectType<Parameters<typeof ruleCollection>[0]>({ rule: "warning" });

expectType<Parameters<typeof ruleCollection>[0]>({ rule: ["error"] });
expectType<Parameters<typeof ruleCollection>[0]>({ rule: [false] });
expectType<Parameters<typeof ruleCollection>[0]>({ rule: ["warn"] });
// @ts-expect-error 'warning' is no valid LintLevel
expectType<Parameters<typeof ruleCollection>[0]>({ rule: ["warning"] });

expectType<Parameters<typeof ruleCollection>[0]>({
  rule: ["error", undefined],
});
// @ts-expect-error rule does not expect any settings
expectType<Parameters<typeof ruleCollection>[0]>({ rule: ["error", true] });

expectType<Parameters<typeof ruleCollection>[0]>({
  ruleWIthSettings: ["warn", { some: { nested: "setting" }, setting: false }],
});
// @ts-expect-error object does not match
expectType<Parameters<typeof ruleCollection>[0]>({
  ruleWIthSettings: ["warn", { some: { nested: false }, setting: true }],
});

// collection -----------------------------------------------------------------

expectType<LintRule[]>(ruleCollection());
