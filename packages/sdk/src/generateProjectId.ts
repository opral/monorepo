import type { Repository } from "@lix-js/client"
import { hash } from "@lix-js/client"
import { type NodeishFilesystem } from "@lix-js/fs"

export async function maybeCreateProjectId({
	nodeishFs,
	projectPath,
	repo,
}: {
	nodeishFs: any
	projectPath: string
	repo: Repository
}) {
	let projectId: string | undefined
	const fs = nodeishFs as NodeishFilesystem

	try {
		projectId = await fs.readFile(projectPath + "/project_id", {
			encoding: "utf-8",
		})
	} catch (error) {
		// @ts-ignore
		if (error.code === "ENOENT") {
			if (repo) {
				projectId = await generateProjectId(repo, projectPath)
				if (projectId) {
					await fs.writeFile(projectPath + "/project_id", projectId)
				}
			}
		} else {
			return { error }
		}
	}
	return { projectId }
}

export async function generateProjectId(repo: Repository, projectPath: string) {
	if (!repo || !projectPath) {
		return undefined
	}
	const firstCommitHash = await repo.getFirstCommitHash()
	const originHash = await repo.getOrigin({ safeHashOnly: true })

	if (firstCommitHash) {
		return hash(`${firstCommitHash + projectPath + originHash}`)
	}
	return undefined
}
