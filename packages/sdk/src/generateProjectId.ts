import type { Repository } from "@lix-js/client"

export async function generateProjectId(repo: Repository, projectPath: string) {
	if (!repo || !projectPath) {
		return undefined
	}
	const repoMeta = await repo.getMeta()

	if (repoMeta && !("error" in repoMeta)) {
		const idDigest = await crypto.subtle.digest(
			"SHA-256",
			new TextEncoder().encode(`${repoMeta.id + projectPath}`)
		)
		return [...new Uint8Array(idDigest)].map((b) => ("00" + b.toString(16)).slice(-2)).join("")
	}
	return undefined
}
