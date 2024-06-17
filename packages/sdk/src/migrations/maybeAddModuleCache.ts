import type { Repository } from "@lix-js/client"
import type { NodeishFilesystem } from "@lix-js/fs"

const EXPECTED_IGNORES = ["cache"]

export async function maybeAddModuleCache(args: {
	projectPath: string
	repo?: Repository
}): Promise<void> {
	if (args.repo === undefined) return

	// This is how paths are handled in the other migrations.
	// Is this reliable on windows?
	const gitignorePath = args.projectPath + "/.gitignore"
	const cachePath = args.projectPath + "/cache"

	const gitignoreExists = await fileExists(gitignorePath, args.repo.nodeishFs)
	const cacheExists = await directoryExists(cachePath, args.repo.nodeishFs)

	if (gitignoreExists) {
		// non-destructively add any missing ignores
		const gitignore = await args.repo.nodeishFs.readFile(gitignorePath, { encoding: "utf-8" })
		const missingIgnores = EXPECTED_IGNORES.filter((ignore) => !gitignore.includes(ignore))
		if (missingIgnores.length > 0) {
			await args.repo.nodeishFs.appendFile(gitignorePath, "\n" + missingIgnores.join("\n"))
		}
	} else {
		await args.repo.nodeishFs.writeFile(gitignorePath, EXPECTED_IGNORES.join("\n"))
	}

	if (!cacheExists) {
		await args.repo.nodeishFs.mkdir(cachePath, { recursive: true })
	}
}

async function fileExists(path: string, nodeishFs: NodeishFilesystem): Promise<boolean> {
	try {
		const stat = await nodeishFs.stat(path)
		return stat.isFile()
	} catch {
		return false
	}
}

async function directoryExists(path: string, nodeishFs: NodeishFilesystem): Promise<boolean> {
	try {
		const stat = await nodeishFs.stat(path)
		return stat.isDirectory()
	} catch {
		return false
	}
}
