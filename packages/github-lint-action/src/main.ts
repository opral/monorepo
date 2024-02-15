import * as fs from "node:fs/promises"
import * as core from "@actions/core"
import * as github from "@actions/github"
import { openRepository, findRepoRoot } from "@lix-js/client"
import { loadProject } from "@inlang/sdk"
// import { normalizePath } from "@lix-js/fs"
// import { _import } from "./_import.js"

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

		// @ts-ignore
		const octokit = new github.getOctokit(token)

		const { data: changedFiles } = await octokit.rest.pulls.listFiles({
			owner,
			repo,
			pull_number: pr_number,
		})

		const changedJsonFiles = changedFiles.filter((file: any) => {
			console.log(file.filename)
			return file.filename.endsWith(".json")
			// log the changed file properties
		})
		console.log(`I got ${changedJsonFiles} changed json files`)

		if (changedJsonFiles.length > 0) {
			console.log("No json files were changed in this PR, skipping the action.")
			return
		}

		const baseDirectory = process.cwd()
		const absoluteProjectPath = baseDirectory + project_path
		const repoRoot = await findRepoRoot({ nodeishFs: fs, path: absoluteProjectPath })

		if (!repoRoot) {
			console.log(
				`Could not find repository root for path ${project_path}, falling back to direct fs access`
			)
			return
		}

		const inlangRepo = await openRepository(repoRoot, {
			nodeishFs: fs,
		})

		const project = await loadProject({
			projectPath: absoluteProjectPath,
			repo: inlangRepo,
			appId: "app.inlang.githubI18nLintAction",
		})

		if (project.errors().length > 0) {
			for (const error of project.errors()) {
				throw error
			}
		}

		const pr_reports = project.query.messageLintReports.getAll()
		const pr_lint_summary = pr_reports.reduce(
			(acc: any, report: any) => {
				acc.errors += report.errors.length
				acc.warnings += report.warnings.length
				return acc
			},
			{ errors: 0, warnings: 0 }
		)

		const commentContent = `
				Pull Request #${pr_number} has been updated with: \n
				- ${pr_lint_summary.errors} errors \n
				- ${pr_lint_summary.warnings} warnings \n
			`
		console.log(`I'm going to comment on the PR with:`, commentContent)
		// await octokit.rest.issues.createComment({
		// 	owner,
		// 	repo,
		// 	issue_number: pr_number,
		// 	body: commentContent,
		// })
		core.setOutput("comment_content", commentContent)
	} catch (error) {
		// Fail the workflow run if an error occurs
		console.log(error)
		if (error instanceof Error) core.setFailed(error.message)
	}
}

export default run
