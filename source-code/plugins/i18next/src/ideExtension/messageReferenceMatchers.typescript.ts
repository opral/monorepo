/**
 * Not running in the browser, so we can't use this parser...
 * Would be the most elegant solution though. Keeping for reference.
 */

import type { MessageReferenceMatch } from "@inlang/core/config"

import {
	createSourceFile,
	SyntaxKind,
	type Node,
	ScriptTarget,
	ScriptKind,
	forEachChild,
} from "typescript"

export function recursive(node: Node, result: MessageReferenceMatch[]) {
	// console.log(node.kind, SyntaxKind[node.kind])
	switch (node.kind) {
		// regular function call matching e.g. t("some-id")
		case SyntaxKind.CallExpression: {
			// ------- START MATCHING NODES -------
			const functionName = node.getChildAt(0)
			if (functionName.getText() !== "t") break
			const openingParenthesis = node.getChildAt(1)
			if (openingParenthesis.kind !== SyntaxKind.OpenParenToken) break
			const parameters = node.getChildAt(2)
			if (parameters.kind !== SyntaxKind.SyntaxList) break
			const closingParenthesis = node.getChildAt(3)
			if (closingParenthesis?.kind !== SyntaxKind.CloseParenToken) break
			//! Don't know why this is 0 instead of 1 as for JSX
			const messageIdNode = parameters.getChildAt(0)
			if (messageIdNode.kind !== SyntaxKind.StringLiteral) break
			// ------- END MATCHING NODES -------
			const document = node.getSourceFile()
			result.push({
				// remove quotes 'messageId' -> messageId
				messageId: messageIdNode.getText().slice(1, -1),
				position: {
					start: {
						line: document.getLineAndCharacterOfPosition(openingParenthesis.pos).line,
						// remove opening parenthesis and quotes ('messageId' -> messageId
						character: document.getLineAndCharacterOfPosition(openingParenthesis.pos).character + 2,
					},
					end: {
						line: document.getLineAndCharacterOfPosition(closingParenthesis.pos).line,
						// remove quotes messageId' -> messageId
						character: document.getLineAndCharacterOfPosition(closingParenthesis.pos).character - 1,
					},
				},
			} satisfies MessageReferenceMatch)
			break
		}

		// JSX matching e.g. <p>{t("some-id")}</p>
		case SyntaxKind.MethodDeclaration: {
			// ------- START MATCHING NODES -------
			const functionName = node.getChildAt(0)
			if (functionName.getText() !== "t") break
			const openingParenthesis = node.getChildAt(1)
			if (openingParenthesis.kind !== SyntaxKind.OpenParenToken) break
			const parameters = node.getChildAt(2)
			if (parameters.kind !== SyntaxKind.SyntaxList) break
			const closingParenthesis = node.getChildAt(3)
			if (closingParenthesis?.kind !== SyntaxKind.CloseParenToken) break
			const messageIdNode = parameters.getChildAt(1)
			if (messageIdNode.kind !== SyntaxKind.StringLiteral) break
			// ------- END MATCHING NODES -------
			const document = node.getSourceFile()
			result.push({
				// remove quotes 'messageId' -> messageId
				messageId: messageIdNode.getText().slice(1, -1),
				position: {
					start: {
						line: document.getLineAndCharacterOfPosition(openingParenthesis.pos).line,
						character: document.getLineAndCharacterOfPosition(openingParenthesis.pos).character + 2,
					},
					end: {
						line: document.getLineAndCharacterOfPosition(closingParenthesis.pos).line,
						character: document.getLineAndCharacterOfPosition(closingParenthesis.pos).character - 1,
					},
				},
			} satisfies MessageReferenceMatch)
			break
		}
	}
	forEachChild(node, (node) => recursive(node, result))
}

export function parse(sourceCode: string) {
	const sourceFile = createSourceFile("dummy.ts", sourceCode, ScriptTarget.ESNext, ScriptKind.TSX)
	const result: MessageReferenceMatch = []
	recursive(sourceFile, result)
	return result
}
