import Ajv from "ajv"
import type { Root as Ast } from "mdast"
import { schemasByType } from "./schemas.js"

/**
 * Validate an mdast-shaped AST recursively against known node schemas.
 * Returns true if all nodes validate; false otherwise.
 */
export function validateAst(ast: Ast): boolean {
	// @ts-expect-error
	const ajv = new Ajv({ allErrors: true, strict: false })
	const validators = new Map<string, any>()

	const validateNode = (node: any): boolean => {
		const schema = (schemasByType as any)[node.type]
		if (!schema) return false
		let validate = validators.get(node.type)
		if (!validate) {
			validate = ajv.compile(schema)
			validators.set(node.type, validate)
		}
		const ok = validate(node) as boolean
		if (!ok) return false
		if (Array.isArray(node.children)) {
			for (const child of node.children) {
				if (!validateNode(child)) return false
			}
		}
		return true
	}

	return validateNode(ast as any)
}

export type { Ast }
