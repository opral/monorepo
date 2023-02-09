import type { LintableNode, LintConfigSettings, LintedNode, LintType } from './schema.js'

export const parseLintType = (settings: LintConfigSettings<unknown>, defaultLevel: LintType): false | LintType => {
	if (settings === false) return false
	if (settings === 'error') return 'error'
	if (settings === 'warning') return 'warning'

	return defaultLevel
}

export const createReporter = (id: string, type: LintType) => {
	return {
		reportIssue: (node: LintableNode, message: string, metadata?: unknown) => {
			if (!node) return

			node.lint = [
				...((node as LintedNode).lint || []),
				{
					id,
					type,
					message,
					...(metadata ? { metadata } : undefined)
				}
			]
		}
	}
}
