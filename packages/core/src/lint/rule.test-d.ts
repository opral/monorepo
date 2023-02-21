import { expectType } from 'tsd'
import type { LintLevel } from './context.js'
import { ConfiguredLintRule, createRule, LintRule, LintRuleId, NodeVisitors } from './rule.js'

// parameters -----------------------------------------------------------------

expectType<Parameters<typeof createRule>[0]>('lint.id')
// @ts-expect-error first parameter must be a LintId
expectType<Parameters<typeof createRule>[0]>('id')

expectType<Parameters<typeof createRule>[1]>('warn')
expectType<Parameters<typeof createRule>[1]>('error')
// @ts-expect-error second parameter must be the LintLevel
expectType<Parameters<typeof createRule>[1]>('something')

expectType<Parameters<typeof createRule>[2]>(() => ({
	initialize: () => undefined,
	visitors: {}
}))
// @ts-expect-error third parameter must return an initialize function
expectType<Parameters<typeof createRule>[2]>(() => ({
	visitors: {}
}))
// @ts-expect-error third parameter must return the visitors object
expectType<Parameters<typeof createRule>[2]>(() => ({
	initialize: () => undefined
}))

// rule -----------------------------------------------------------------------

const rule = createRule(
	'a.b',
	'error', () => ({
		initialize: () => undefined,
		visitors: {},
	})
)

expectType<LintRule>(rule)
expectType<Parameters<LintRule>[0]>(false)
expectType<Parameters<LintRule>[0]>('error')
expectType<Parameters<LintRule>[0]>('warn')
// @ts-expect-error 'off' is not a valid LintLevel
expectType<Parameters<LintRule>[0]>('off')

expectType<Parameters<LintRule>[1]>(undefined)
// @ts-expect-error rule does not expect any settings
expectType<Parameters<LintRule>[1]>({ debug: true })

expectType<Parameters<LintRule<true>>[1]>(undefined)
expectType<Parameters<LintRule<true>>[1]>(true)
// @ts-expect-error rule expect true as settings
expectType<Parameters<LintRule<true>>[1]>(false)

expectType<Parameters<LintRule<{ debug: true }>>[1]>({ debug: true })
// @ts-expect-error rule expect object as settings
expectType<Parameters<LintRule<{ debug: true }>>[1]>(true)
// @ts-expect-error rule expect object with debug property as settings
expectType<Parameters<LintRule<{ debug: true }>>[1]>({})

// configured rule ------------------------------------------------------------

const configuredRule = rule()

expectType<ConfiguredLintRule>(configuredRule)

expectType<LintRuleId>(configuredRule.id)
expectType<LintLevel | false>(configuredRule.level)
expectType<NodeVisitors>(configuredRule.visitors)
