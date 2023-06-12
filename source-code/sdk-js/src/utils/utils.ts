import { Project, Node } from "ts-morph"
import { dedent } from 'ts-dedent'

// ------------------------------------------------------------------------------------------------

// TODO: https://ts-morph.com/manipulation/settings
const parseCode = (code: string) => new Project().createSourceFile('', code)

const printCode = (node: Node) => node && node.print().trim() || ''

// ------------------------------------------------------------------------------------------------

export const codeToSourceFile = (code: string) => parseCode(dedent(code))

export const codeToNode = (code: string) => {
	const node = codeToSourceFile(code).getStatement(Node.isVariableStatement)?.getDeclarationList().getDeclarations()[0]

	if (!node) {
		throw new Error('codeToDeclarationAst: could not find declaration')
	}

	if (node.getName() !== 'x') {
		throw new Error('you must name the variable "x"')
	}

	const initializer = node.getInitializer()
	if (!initializer) {
		throw new Error('codeToDeclarationAst: could not find initializer')
	}

	return initializer
}

export const nodeToCode = (ast: any) => printCode(ast)


// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------


// TODO: remove the following code

import * as recast from "recast"
import type { NodePath as NodePathOriginal } from "ast-types/lib/node-path"
import type { ASTNode } from "ast-types/lib/types"
import { namedTypes as n } from "ast-types"
type NodePath<V = any> = NodePathOriginal<any, V>

export type {
	ASTNode,
	NodePath,
}

export const b = recast.types.builders

export { n }

export const visitNode = recast.visit
