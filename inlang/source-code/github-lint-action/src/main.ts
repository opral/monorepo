import "dotenv/config"
import * as fs from "node:fs/promises"
import * as core from "@actions/core"
import * as github from "@actions/github"
import { openRepository, findRepoRoot } from "@lix-js/client"
import { loadProject } from "@inlang/sdk"
import { normalizePath } from "@lix-js/fs"
import { _import } from "./_import.js"

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
	console.log("Running the action")

	const __import = new Function("p", "return import(p)")

	const uri = "https://cdn.jsdelivr.net/npm/jquery/dist/jquery.min.js"
	try {
		const module = await __import(uri)
		console.log("module imported")
		console.log(module.default)
	} catch (err) {
		console.log(err)
	}

	try {
		const token: string = core.getInput("token", { required: true })
		const project_path: string = core.getInput("project_path", { required: true })
		const { owner, repo } = github.context.repo
		const pr_number = github.context.payload.pull_request?.number
		// You can also pass in additional options as a second parameter to getOctokit
		// const octokit = github.getOctokit(myToken, {userAgent: "MyActionVersion1"});

		// Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
		console.log(`I got all inputs: ${token} ${project_path}`)

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
			_import: _import(normalizePath(project_path)),
		})
		console.log(project?.settings().toString())

		if (project.errors().length > 0) {
			for (const error of project.errors()) {
				throw error
			}
		}

		console.log(`settings: ${project.settings()}`)
		console.log(`messages:" ${project.query.messages.getAll()}`)

		// @ts-ignore
		const octokit = new github.getOctokit(token)

		const { data: changedFiles } = await octokit.rest.pulls.listFiles({
			owner,
			repo,
			pull_number: pr_number,
		})

		console.log(`I got changed files: ${changedFiles}`)

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

		console.log(`I got diffData: ${diffData}`)

		const commentContent = `
				Pull Request #${pr_number} has been updated with: \n
				- ${diffData.changes} changes \n
				- ${diffData.additions} additions \n
				- ${diffData.deletions} deletions \n
				- ${project.query.messages.getAll().length} inlang messages \n
			`

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
