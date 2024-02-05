import * as core from "@actions/core"
import * as github from "@actions/github"
import "dotenv/config"

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
	try {
		const owner: string = core.getInput("owner", { required: true })
		const repo: string = core.getInput("repo", { required: true })
		const pr_number: string = core.getInput("pr_number", { required: true })
		const token: string = core.getInput("token", { required: true })

		// Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
		core.debug(`I got all inputs: ${owner} ${repo} ${pr_number} ${token}`)

		// @ts-ignore
		const octokit = new github.getOctokit(token)

		const { data: changedFiles } = await octokit.rest.pulls.listFiles({
			owner,
			repo,
			pull_number: pr_number,
		})

		core.debug(`I got changed files: ${changedFiles}`)

		let diffData = {
			additions: 0,
			deletions: 0,
			changes: 0,
		}

		diffData = changedFiles.reduce((acc: any, file: any) => {
			acc.additions += file.additions
			acc.deletions += file.deletions
			acc.changes += file.changes
			return acc
		}, diffData)

		for (const file of changedFiles) {
			const fileExtension = file.filename.split(".").pop()
			switch (fileExtension) {
				case "md":
					await octokit.rest.issues.addLabels({
						owner,
						repo,
						issue_number: pr_number,
						labels: ["markdown"],
					})
					break
				case "js":
					await octokit.rest.issues.addLabels({
						owner,
						repo,
						issue_number: pr_number,
						labels: ["javascript"],
					})
					break
				case "yml":
					await octokit.rest.issues.addLabels({
						owner,
						repo,
						issue_number: pr_number,
						labels: ["yaml"],
					})
					break
				case "yaml":
					await octokit.rest.issues.addLabels({
						owner,
						repo,
						issue_number: pr_number,
						labels: ["yaml"],
					})
			}
		}

		core.debug(`I got diffData: ${diffData}`)

		await octokit.rest.issues.createComment({
			owner,
			repo,
			issue_number: pr_number,
			body: `
		    Pull Request #${pr_number} has been updated with: \n
		    - ${diffData.changes} changes \n
		    - ${diffData.additions} additions \n
		    - ${diffData.deletions} deletions \n
		  `,
		})
	} catch (error) {
		// Fail the workflow run if an error occurs
		if (error instanceof Error) core.setFailed(error.message)
	}
}
