import { dedent } from 'ts-dedent'
import * as recast from "recast"
import * as parser from "recast/parsers/acorn"

export const parseCode = (code: string) => recast.parse(code, { parser })

export const printCode = (ast: recast.types.ASTNode) => recast.print(ast).code

// ------------------------------------------------------------------------------------------------

export const codeToAst = (code: string) => parseCode(dedent(code))

export const codeToDeclarationAst = (code: string) => codeToAst(code).program.body[0].declarations[0]

export const astToCode = (ast: recast.types.ASTNode) => recast.print(ast).code
