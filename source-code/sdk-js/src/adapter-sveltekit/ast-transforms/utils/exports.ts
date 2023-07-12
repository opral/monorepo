import { Node, type SourceFile } from 'ts-morph'
import { findExport } from '../../../ast-transforms/utils/exports.js'

// TODO: test
export const addDataExportIfMissingAndReturnInsertionIndex = (sourceFile: SourceFile) => {
	const dataExport = findExport(sourceFile, 'data')
	if (dataExport) return dataExport.getParent().getParent()?.getChildIndex() || 0

	const statements = sourceFile.getStatements()
	// find insertion point should come right after all imports (which ideally are on the top of the script section)
	const index = Math.max(
		statements.findIndex(statement => !Node.isImportDeclaration(statement)),
		statements.length
	)

	sourceFile.insertStatements(index, `export let data`)

	return index
}

