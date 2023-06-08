import type * as recast from "recast"
import { codeToAst } from '../recast.js'

export const arrowFunctionAst = codeToAst(`const fn = () => {}`)
	.program.body[0].declarations[0] as recast.types.namedTypes.ArrowFunctionExpression

export const functionAst = codeToAst(`const fn = function() {}`)
	.program.body[0].declarations[0] as recast.types.namedTypes.FunctionDeclaration

export const variableDeclaratorAst = codeToAst(`const fn = someFn`)
	.program.body[0].declarations[0] as recast.types.namedTypes.VariableDeclarator