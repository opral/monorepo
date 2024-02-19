import * as fs from "node:fs/promises"
import * as core from "@actions/core"
import * as github from "@actions/github"
import { openRepository } from "@lix-js/client"
import { loadProject, type MessageLintReport } from "@inlang/sdk"

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
	console.log("Running the action")

	try {
		const token: string = core.getInput("token", { required: true })
		const project_path: string = core.getInput("project_path", { required: true })
		const { owner, repo } = github.context.repo
		const pr_number = github.context.payload.pull_request?.number

		const inlangRepo = await openRepository(process.cwd(), {
			nodeishFs: fs,
			branch: github.context.payload.pull_request?.head.ref,
		})
		const project = await loadProject({
			projectPath: process.cwd() + project_path,
			repo: inlangRepo,
			appId: "app.inlang.githubI18nLintAction",
		})
		if (project.errors().length > 0) {
			for (const error of project.errors()) {
				throw error
			}
		}
		const lintSummary = createLintSummary(project.query.messageLintReports.getAll())

		const headMeta = {
			owner: github.context.payload.pull_request?.head.label.split(":")[0],
			repo: repo,
			branch: github.context.payload.pull_request?.head.label.split(":")[1],
		}
		const commentContent = `
				Pull Request #${pr_number} has been updated with: \n
				- ${lintSummary.errors} errors \n
				- ${lintSummary.warnings} warnings \n

				[Open in Fink](https://fink.inlang.com/github.com/${headMeta.owner}/${headMeta.repo}/?branch=${headMeta.branch}&project=${project_path})
			`
		console.log(`I'm going to comment on the PR with:`, commentContent)

		const octokit = github.getOctokit(token)
		// Fetch issue details
		const issue = await octokit.rest.issues.get({
			owner,
			repo,
			issue_number: pr_number as number,
		})
		// if (issue.data.locked) return console.log("PR is locked, skipping comment")
		//check if PR already has a comment from this action
		const existingComment = await octokit.rest.issues.listComments({
			owner,
			repo,
			issue_number: pr_number as number,
		})
		console.log("existingComment: ", existingComment)
		if (existingComment.data.length > 0) {
			console.log("Comment already exists, updating it")
			const commentId = existingComment.data.find((comment) =>
				comment.body?.includes("Pull Request #")
			)?.id
			if (commentId) {
				await octokit.rest.issues.updateComment({
					owner,
					repo,
					comment_id: commentId,
					body: commentContent,
				})
				core.setOutput("comment_content", commentContent)
				return
			}
		}

		console.log("Creating a new comment")
		await octokit.rest.issues.createComment({
			owner,
			repo,
			issue_number: pr_number as number,
			body: commentContent,
		})
		core.setOutput("comment_content", commentContent)
	} catch (error) {
		// Fail the workflow run if an error occurs
		console.log(error)
		if (error instanceof Error) core.setFailed(error.message)
	}
}

function createLintSummary(reports: MessageLintReport[]) {
	return reports.reduce(
		(acc, report: MessageLintReport) => {
			acc.errors += report.level === "error" ? 1 : 0
			acc.warnings += report.level === "warning" ? 1 : 0
			return acc
		},
		{ errors: 0, warnings: 0 }
	)
}

export default run
