import type {
	LintedNode,
	LintReport,
	LintedResource,
	LintedMessage,
	LintedPattern,
	LintRule,
} from "./rule.js"

/**
 * Query options for lints.
 *
 *
 */
type QueryOptions = {
	nested?: boolean
	level?: LintRule["level"]
	id?: LintRule["id"]
}

/**
 * Extracts all lint reports that are present on the given node.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param node the node to extract lint reports from
 * @param options.nested if set to `false` will just return the lint reports directly attached on this node
 * @param options.level filter based on the level
 * @param options.id filter based on the lint id
 * @returns a list of lint reports
 */
export const getLintReports = (
	node: LintedNode | LintedNode[],
	// Writing out QueryOptions for a better DX.
	// Developers can see the options instead of the type.
	options?: {
		level?: LintRule["level"]
		id?: LintRule["id"]
		nested?: boolean
	},
): LintReport[] => {
	const withDefaults = { nested: true, ...options }
	if (Array.isArray(node)) {
		return node.flatMap((n) => getLintReports(n, withDefaults))
	}
	const { type } = node
	switch (type) {
		case "Resource":
			return withFilters(getLintReportsFromResource(node, withDefaults), withDefaults)
		case "Message":
			return withFilters(getLintReportsFromMessage(node, withDefaults), withDefaults)
		case "Pattern":
			return withFilters(getLintReportsFromPattern(node), withDefaults)
		default:
			// If an unhandled node type is encountered, it is a bug in inlang's source code.
			// The lint implementation is responsible for handling all node types, not user land.
			throw new Error(
				`Unhandled linted node type: ${type}. You stumbled upon a bug in inlang's source code. Please open an issue on GitHub`,
			)
	}
}

const getLintReportsFromResource = (
	{ lint, body }: LintedResource,
	options: QueryOptions,
): LintReport[] => [
	...(lint || []),
	...(options.nested ? body.flatMap((message) => getLintReportsFromMessage(message, options)) : []),
]

const getLintReportsFromMessage = (
	{ lint, pattern }: LintedMessage,
	options: QueryOptions,
): LintReport[] => [...(lint || []), ...(options.nested ? getLintReportsFromPattern(pattern) : [])]

const getLintReportsFromPattern = ({ lint }: LintedPattern): LintReport[] => lint || []

/**
 * Applies filters based on the QueryOptions to a lint report.
 */
const withFilters = (report: LintReport[], options: QueryOptions) => {
	return report.filter((report) => {
		if (options.id && report.id !== options.id) {
			return false
		} else if (options.level && report.level !== options.level) {
			return false
		}
		return true
	})
}

// --------------------------------------------------------------------------------------------------------------------

/**
 * Checks if a given node has lint reports attached to it.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param node the node to extract lint reports from
 * @param options.nested if set to `false` will just return the lint reports directly attached on this node
 * @param options.level filter based on the level
 * @param options.id filter based on the lint id
 * @returns `true` iff the given node has lint reports
 */
export const hasLintReports = (
	node: LintedNode | LintedNode[], // Writing out QueryOptions for a better DX.
	// Developers can see the options instead of the type.
	options?: {
		level?: LintRule["level"]
		id?: LintRule["id"]
		nested?: boolean
	},
): boolean => getLintReports(node, options).length > 0
