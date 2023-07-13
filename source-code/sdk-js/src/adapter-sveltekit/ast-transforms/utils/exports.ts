import { Node, type SourceFile } from 'ts-morph'
import { findExport } from '../../../ast-transforms/utils/exports.js'

// TODO: test
// TODO: assumption is that no inlang import gets used before `export let data`
export const addDataExportIfMissingAndReturnInsertionIndex = (sourceFile: SourceFile) => {
	const dataExport = findExport(sourceFile, 'data')
	if (dataExport) return dataExport.getParent().getParent()?.getChildIndex() || 0

	const statements = sourceFile.getStatements()
	// find insertion point should come right after all imports (which ideally are on the top of the script section)
	let index = statements.findIndex(statement => !Node.isImportDeclaration(statement))
	if (index < 0)	index = statements.length

	sourceFile.insertStatements(index, `export let data`)

	return index
}

