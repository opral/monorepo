import type { Repository } from "@lix-js/client"
import { hash } from "@lix-js/client"

export async function generateProjectId(repo: Repository, projectPath: string) {
	if (!repo || !projectPath) {
		return undefined
	}
	const repoId = await repo.getId()
	const originHash = await repo.getOrigin({ safeHashOnly: true })

	if (repoId) {
		return hash(`${repoId + projectPath + originHash}`)
	}
	return undefined
}
