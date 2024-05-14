import * as MF from "messageformat"
import type * as AST from "../v2/types.js"

/**
 * Utility function to generate message bundles for tests
 *
 * @throws if the given source-strings aren't valid or not representable
 */
export function createMessageBundle(bundleOptions: {
	id: string
	aliases?: Record<string, string>
	/**
	 * A map of languages to ICU MessageFormat 2 message strings
	 */
	messages: Record<string, string>
}): AST.MessageBundle {
	const bundle: AST.MessageBundle = {
		id: bundleOptions.id,
		alias: bundleOptions.aliases || {},

		messages: Object.entries(bundleOptions.messages).map(([locale, source]) =>
			parseICUMessage(locale, source)
		),
	}

	return bundle
}

function parseICUMessage(locale: string, source: string): AST.Message {
	const ast = MF.parseMessage(source)
	const declarations = ast.declarations.map(toDeclaration)

	switch (ast.type) {
		case "message": {
			return {
				locale,
				declarations,
				selectors: [],
				variants: [
					{
						match: [],
						pattern: toPattern(ast.pattern),
					},
				],
			}
		}
		case "select": {
			return {
				locale,
				declarations,
				selectors: ast.selectors.map(toExpression),
				variants: ast.variants.map(toVariant),
			}
		}
	}
}

function toVariant(mfVariant: MF.Variant): AST.Variant {
	return {
		match: mfVariant.keys.map((key) => (key.type === "literal" ? key.value : "*")),
		pattern: toPattern(mfVariant.value),
	}
}

function toDeclaration(mfDeclaration: MF.Declaration): AST.Declaration {
	switch (mfDeclaration.type) {
		case "input": {
			return {
				type: mfDeclaration.type,
				name: mfDeclaration.name,
				value: toExpression(mfDeclaration.value),
			}
		}
		default: {
			throw new Error("Unsupported declaration type: " + mfDeclaration.type)
		}
	}
}

function toPattern(mfPattern: MF.Pattern): AST.Pattern {
	return mfPattern.map((element) => {
		if (typeof element == "string")
			return {
				type: "text",
				value: element,
			}

		if (element.type === "expression") return toExpression(element)
		throw new Error("Unknown pattern element type: " + element.type)
	})
}

function toExpression(mfExpression: MF.Expression): AST.Expression {
	const annotation = mfExpression.annotation
	const arg = mfExpression.arg
	if (!arg) throw new Error()
	return {
		type: "expression",
		arg,
		annotation: annotation ? toAnnotation(annotation) : undefined,
	}
}

function toAnnotation(
	mfAnnotation: MF.FunctionAnnotation | MF.UnsupportedAnnotation
): AST.FunctionAnnotation {
	if (mfAnnotation.type !== "function") throw new Error("Junk annotation")
	return {
		type: "function",
		name: mfAnnotation.name,
		options:
			mfAnnotation.options?.map((mfOption) => ({
				name: mfOption.name,
				value: mfOption.value,
			})) || [],
	}
}
