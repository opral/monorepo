import type { Repository } from "@lix-js/client"
// import { hash } from "@lix-js/client"

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
	// eslint-disable-next-line no-console
	console.log("😳 maybeCreateFirstProjectId start")
	// the migration assumes a repository
	if (args.repo === undefined) {
		// eslint-disable-next-line no-console
		console.log("😳 maybeCreateFirstProjectId returning because no repo")
		return
	}
	try {
		// eslint-disable-next-line no-console
		console.log("😳 maybeCreateFirstProjectId try readFile " + args.projectPath + "/project_id")
		await args.repo.nodeishFs.readFile(args.projectPath + "/project_id", {
			encoding: "utf-8",
		})
	} catch (error) {
		// @ts-ignore
		// eslint-disable-next-line no-console
		console.log("😳 maybeCreateFirstProjectId readFile error ", error.code, error)
		// @ts-ignore
		if (error.code === "ENOENT" && args.repo) {
			// eslint-disable-next-line no-console
			console.log("😳 Generating new project_id")
			const projectId = await generateProjectId({ repo: args.repo, projectPath: args.projectPath })
			if (projectId) {
				// eslint-disable-next-line no-console
				console.log("😳 maybeCreateFirstProjectId writeFile" + args.projectPath + "/project_id")
				await args.repo.nodeishFs
					.writeFile(args.projectPath + "/project_id", projectId)
					.catch((error) => {
						// eslint-disable-next-line no-console
						console.log("😳 maybeCreateFirstProjectId error writing project_id", error)
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
	// eslint-disable-next-line no-console
	console.log("😳 generateProjectI getFirstCommitHash")
	const firstCommitHash = await args.repo.getFirstCommitHash()
	// eslint-disable-next-line no-console
	console.log("😳 generateProjectI getFirstCommitHash returned", firstCommitHash)

	if (firstCommitHash) {
		try {
			return "1234-1234-1234" // await hash(`${firstCommitHash + args.projectPath}`)
		} catch (error) {
			console.error("Failed to generate project_id", error)
		}
	}
	return undefined
}
