import type { Ast, MarkdownNode } from "./schemas.js"

const STRING_FIELDS = ["title", "alt", "label", "identifier", "referenceId"]
const URL_FIELDS = ["url"]
const LANG_FIELDS = ["lang", "meta"]
const BREAK_PATTERN = /\r\n?|\u2028|\u2029/g

/**
 * Normalize an mdast-shaped AST (or subtree) using Prettier-like rules.
 *
 * Drops parser metadata (`position`), prunes undefined/empty values, normalizes
 * line endings, and removes empty text nodes. The resulting structure
 * serializes deterministically which keeps persisted snapshots stable.
 */
export function normalizeAst<T extends Ast | MarkdownNode>(node: T): T {
	return normalizeNode(node)
}

function normalizeNode(node: any): any {
	if (!node || typeof node !== "object") return node

	// Drop parser metadata that should not influence diffing or persistence.
	if ("position" in node) delete node.position

	// Remove undefined entries from data; delete empty objects.
	if (node.data && typeof node.data === "object") {
		for (const key of Object.keys(node.data)) {
			if (node.data[key] === undefined) delete node.data[key]
		}
		if (Object.keys(node.data).length === 0) delete node.data
	} else if (node.data === undefined || node.data === null) {
		delete node.data
	}

	normalizeStringField(node, "value")
	for (const field of STRING_FIELDS) normalizeStringField(node, field)
	for (const field of URL_FIELDS)
		normalizeStringField(node, field, {
			dropEmpty: true,
		})
	for (const field of LANG_FIELDS)
		normalizeStringField(node, field, {
			dropEmpty: true,
		})

	// Normalize booleans/optionals that Prettier omits when null-ish.
	if ("checked" in node && (node.checked === null || node.checked === undefined)) {
		delete node.checked
	}
	if ("spread" in node && (node.spread === null || node.spread === undefined)) {
		delete node.spread
	}
	if ("start" in node) {
		if (node.start === null || node.start === undefined || node.start === 1) {
			delete node.start
		}
	}

	// Recursively normalize children.
	if (Array.isArray(node.children)) {
		const normalizedChildren: any[] = []
		for (const child of node.children) {
			if (!child || typeof child !== "object") continue
			const normalizedChild = normalizeNode(child)
			if (isEmptyTextNode(normalizedChild)) continue
			normalizedChildren.push(normalizedChild)
		}
		node.children = normalizedChildren
	} else if ("children" in node) {
		delete node.children
	}

	return node
}

function normalizeStringField(node: any, field: string, opts?: { dropEmpty?: boolean }) {
	if (!(field in node)) return
	const raw = node[field]
	if (raw === null || raw === undefined) {
		delete node[field]
		return
	}
	if (typeof raw !== "string") return
	const normalized = normalizeLineEndings(raw)
	if (opts?.dropEmpty && normalized.trim().length === 0) {
		delete node[field]
		return
	}
	node[field] = normalized
}

function normalizeLineEndings(value: string) {
	return value.replace(BREAK_PATTERN, "\n")
}

function isEmptyTextNode(node: any) {
	if (!node || typeof node !== "object") return false
	if (node.type !== "text") return false
	const value = node.value
	return typeof value !== "string" || value.length === 0
}
