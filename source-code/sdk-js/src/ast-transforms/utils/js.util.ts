import { Project, Node, QuoteKind, IndentationText, ScriptKind } from "ts-morph"
import { dedent } from "ts-dedent"
import { InlangException } from '../../exceptions.js'

// ------------------------------------------------------------------------------------------------

const parseCode = (code: string, filePath: string | undefined) =>
	new Project({
		manipulationSettings: {
			quoteKind: QuoteKind.Single,
			indentationText: IndentationText.Tab,
			useTrailingCommas: true,
		},
	}).createSourceFile(filePath || "_dummy_.ts", code, { overwrite: true })

const printCode = (node: Node) => (node && node.print({ scriptKind: ScriptKind.TS }).trim()) || ""

// ------------------------------------------------------------------------------------------------

export const codeToSourceFile = (code: string, filePath?: string) => parseCode(dedent(code), filePath)

export const codeToNode = (code: string) => {
	const node = codeToSourceFile(code, "")
		.getStatement(Node.isVariableStatement)
		?.getDeclarationList()
		.getDeclarations()[0]

	if (!node) {
		throw new InlangException("Could not find variable declaration.")
	}

	if (node.getName() !== "x") {
		throw new InlangException("The variable must be named 'x'.")
	}

	const initializer = node.getInitializer()
	if (!initializer) {
		throw new InlangException("Could not find variable initializer.")
	}

	return initializer
}

export const nodeToCode = (node: Node) => printCode(node)
