import type { Repository } from "@lix-js/client"
import { hash } from "@lix-js/client"

export async function generateProjectId(repo: Repository, projectPath: string) {
	if (!repo || !projectPath) {
		return undefined
	}
	const repoMeta = await repo.getMeta()

	if (repoMeta && !("error" in repoMeta)) {
		return hash(`${repoMeta.id + projectPath}`)
	}
	return undefined
}
