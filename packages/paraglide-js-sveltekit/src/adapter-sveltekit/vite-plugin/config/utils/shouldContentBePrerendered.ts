import path from "node:path"
import { findExport } from "../../../../ast-transforms/utils/exports.js"
import { codeToSourceFile } from "../../../../ast-transforms/utils/js.util.js"
import { Node } from "ts-morph"
import type { NodeishFilesystem } from "@lix-js/fs"

export const shouldContentBePrerendered = async (fs: NodeishFilesystem, routesFolder: string) => {
	const filesToLookFor = ["+layout.server.js", "+layout.server.ts", "+layout.js", "+layout.ts"]

	const prerenderExportVCalues = await Promise.all(
		filesToLookFor.map(async (file) => {
			const filePath = path.resolve(routesFolder, file)
			const contents = await fs.readFile(filePath, { encoding: "utf-8" }).catch(() => undefined)
			if (!contents || !contents.trim()) return undefined

			const sourceFile = codeToSourceFile(contents)

			const prerenderExport = findExport(sourceFile, "prerender")
			if (!prerenderExport) {
				return undefined
			}

			if (!Node.isVariableDeclaration(prerenderExport)) {
				return undefined
			}

			return prerenderExport.getInitializer() as Node | undefined
		}),
	)

	return prerenderExportVCalues
		.map(
			(node) =>
				Node.isTrueLiteral(node) ||
				(Node.isStringLiteral(node) && node.getLiteralText() === "auto"),
		)
		.some(Boolean)
}
