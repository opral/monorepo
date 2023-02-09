import type { LintableNode } from './rule.js'
import type { LintConfigSettings, LintedNode, LintLevel } from './schema.js'

export type Reporter = {
	report: (node: LintableNode, message: string, metadata?: unknown) => void
}

export const parseLintSettings = <T>(settings: LintConfigSettings<T>, defaultLevel: LintLevel): { level: false | LintLevel, options: T } => {

	const [level, options] = Array.isArray(settings) ? settings : [settings ?? defaultLevel]

	return { level, options }
}

export const createReporter = (id: string, level: LintLevel): Reporter => ({
	report: (node: LintableNode, message: string, metadata?: unknown) => {
		if (!node) return

		node.lint = [
			...((node as LintedNode).lint || []),
			{
				id,
				level,
				message,
				...(metadata ? { metadata } : undefined)
			}
		]
	}
})
