import { Node, VariableStatement, type SourceFile } from "ts-morph"
import { findExport } from "../../../ast-transforms/utils/exports.js"

// TODO: test
export const addOrMoveDataExportAndReturnIndex = (sourceFile: SourceFile) => {
	const statements = sourceFile.getStatements()
	// find insertion point should come right after all imports (which ideally are on the top of the script section)
	let index = statements.findIndex((statement) => !Node.isImportDeclaration(statement))
	if (index < 0) index = statements.length

	const dataExport = findExport(sourceFile, "data")
	if (dataExport) {
		// move data export after imports
		;(dataExport.getParent().getParent() as VariableStatement)?.setOrder(index)
	} else {
		sourceFile.insertStatements(index, `export let data`)
	}

	return index
}
