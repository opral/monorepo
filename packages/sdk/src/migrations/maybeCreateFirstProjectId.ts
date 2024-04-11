import type { Repository } from "@lix-js/client"
import { hash } from "@lix-js/client"

/**
 * Creates a project id if it does not exist yet.
 *
 * - this is a migration to ensure that all projects have a project id
 * - new projects are created with a project id (in the future)
 */
export async function maybeCreateFirstProjectId(args: {
	projectPath: string
	repo?: Repository
}): Promise<void> {
	// the migration assumes a repository
	if (args.repo === undefined) {
		return
	}
	try {
		await args.repo.nodeishFs.readFile(args.projectPath + "/project_id", {
			encoding: "utf-8",
		})
	} catch (error) {
		// @ts-ignore
		if (error.code === "ENOENT" && args.repo) {
			const projectId = await generateProjectId({ repo: args.repo, projectPath: args.projectPath })
			if (projectId) {
				await args.repo.nodeishFs
					.writeFile(args.projectPath + "/project_id", projectId)
					.catch((error) => {
						console.error("Failed to write project_id", error)
					})
			}
		}
	}
}

export async function generateProjectId(args: { repo?: Repository; projectPath: string }) {
	if (!args.repo || !args.projectPath) {
		return undefined
	}
	const firstCommitHash = await args.repo.getFirstCommitHash()

	if (firstCommitHash) {
		try {
			return await hash(`${firstCommitHash + args.projectPath}`)
		} catch (error) {
			console.error("Failed to generate project_id", error)
		}
	}
	return undefined
}
