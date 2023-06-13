import { Project, Node, QuoteKind, IndentationText, ScriptKind } from "ts-morph"
import { dedent } from "ts-dedent"

// ------------------------------------------------------------------------------------------------

const parseCode = (code: string) =>
	new Project({
		manipulationSettings: {
			quoteKind: QuoteKind.Single,
			indentationText: IndentationText.Tab,
			useTrailingCommas: true,
		},
		// TODO: add correct file path
	}).createSourceFile("", code)
	// }).createSourceFile("test.ts", code, { overwrite: true })

const printCode = (node: Node) => (node && node.print({ scriptKind: ScriptKind.TS }).trim()) || ""

// ------------------------------------------------------------------------------------------------

export const codeToSourceFile = (code: string) => parseCode(dedent(code))

export const codeToNode = (code: string) => {
	const node = codeToSourceFile(code)
		.getStatement(Node.isVariableStatement)
		?.getDeclarationList()
		.getDeclarations()[0]

	if (!node) {
		throw new Error("codeToDeclarationAst: could not find declaration")
	}

	if (node.getName() !== "x") {
		throw new Error('you must name the variable "x"')
	}

	const initializer = node.getInitializer()
	if (!initializer) {
		throw new Error("codeToDeclarationAst: could not find initializer")
	}

	return initializer
}

export const nodeToCode = (node: Node) => printCode(node)
