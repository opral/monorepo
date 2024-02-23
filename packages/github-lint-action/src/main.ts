import * as fs from "node:fs/promises"
import * as core from "@actions/core"
import * as github from "@actions/github"
import { openRepository } from "@lix-js/client"
import { loadProject, type InstalledMessageLintRule, type MessageLintReport } from "@inlang/sdk"
import { exec } from "node:child_process"

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
	core.debug("Running the action")

	try {
		const token = process.env.GITHUB_TOKEN
		if (!token) {
			throw new Error("GITHUB_TOKEN is not set")
		}
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

		const reportsHead = project.query.messageLintReports.getAll()
		const headMeta = {
			owner: github.context.payload.pull_request?.head.label.split(":")[0],
			repo: repo,
			branch: github.context.payload.pull_request?.head.label.split(":")[1],
		}
		const baseMeta = {
			owner: github.context.payload.pull_request?.base.label.split(":")[0],
			repo: repo,
			branch: github.context.payload.pull_request?.base.label.split(":")[1],
		}
		// const isFork = headMeta.owner !== baseMeta.owner
		// If the PR is from a fork, we need to fetch the base reports from the base repo

		await fetchBranch(baseMeta.branch)
		await checkoutBranch(baseMeta.branch)
		await pull()
		const baseInlangRepo = await openRepository(process.cwd(), {
			nodeishFs: fs,
			branch: baseMeta.branch,
		})

		const projectBase = await loadProject({
			projectPath: process.cwd() + project_path,
			repo: baseInlangRepo,
			appId: "app.inlang.githubI18nLintAction",
		})
		if (projectBase.errors().length > 0) {
			for (const error of projectBase.errors()) {
				throw error
			}
		}
		const reportsBase = projectBase.query.messageLintReports.getAll()
		core.debug(`Reports head: ${reportsHead.length}`)
		core.debug(`Reports base: ${reportsBase.length}`)

		const lintSummary = createLintSummary(
			reportsHead,
			reportsBase,
			project.installed.messageLintRules()
		)
		if (lintSummary.length === 0) {
			core.debug("No lint reports found, skipping comment")
			return
		}

		const shortenedProjectPath = () => {
			const parts = project_path.split("/")
			if (parts.length > 3) {
				return `/${parts.at(-3)}/${parts.at(-2)}/${parts.at(-1)}`
			} else {
				return project_path
			}
		}

		const commentContent = `
### 🛎️ Translations need to be updated in \`${shortenedProjectPath}\`

| lint rule | new reports | link |
|-----------|-------------|------|
${lintSummary
	.map(
		(lintSummary) =>
			`| ${lintSummary.name} | ${lintSummary.count} | [contribute (via Fink 🐦)](https://fink.inlang.com/github.com/${headMeta.owner}/${headMeta.repo}?branch=${headMeta.branch}&project=${project_path}&lint=${lintSummary.id}) |`
	)
	.join("\n")}
`

		const octokit = github.getOctokit(token)
		const issue = await octokit.rest.issues.get({
			owner,
			repo,
			issue_number: pr_number as number,
		})
		if (issue.data.locked) return core.debug("PR is locked, skipping comment")

		//check if PR already has a comment from this action
		const existingComment = await octokit.rest.issues.listComments({
			owner,
			repo,
			issue_number: pr_number as number,
		})
		if (existingComment.data.length > 0) {
			const commentId = existingComment.data.find(
				(comment) =>
					comment.body?.includes("🛎️ Translations need to be updated") &&
					comment.user?.login === "github-actions[bot]"
			)?.id
			if (commentId) {
				core.debug("Comment already exists, updating it")
				await octokit.rest.issues.updateComment({
					owner,
					repo,
					comment_id: commentId,
					body: commentContent,
				})
				return
			}
		}

		core.debug("Creating a new comment")
		await octokit.rest.issues.createComment({
			owner,
			repo,
			issue_number: pr_number as number,
			body: commentContent,
		})
	} catch (error) {
		// Fail the workflow run if an error occurs
		if (error instanceof Error) core.setFailed(error.message)
	}
}

export default run

function createLintSummary(
	reportsHead: MessageLintReport[],
	reportsBase: MessageLintReport[],
	installedRules: InstalledMessageLintRule[]
) {
	const summary: { id: string; name: string; count: number }[] = []
	const diffReports = reportsHead.filter(
		(report) =>
			!reportsBase.some(
				(baseReport) =>
					baseReport.ruleId === report.ruleId &&
					baseReport.languageTag === report.languageTag &&
					baseReport.messageId === report.messageId
			)
	)
	for (const installedRule of installedRules) {
		const id = installedRule.id
		const name =
			typeof installedRule.displayName === "object"
				? installedRule.displayName.en
				: installedRule.displayName
		const count = diffReports.filter((report) => report.ruleId === id).length
		if (count > 0) {
			summary.push({ id, name, count: count })
		}
	}
	return summary
}

// Function to checkout a branch
async function checkoutBranch(branchName: string) {
	return new Promise<void>((resolve, reject) => {
		// Execute the git command to checkout the branch
		exec(`git checkout ${branchName}`, { cwd: process.cwd() }, (error, stdout, stderr) => {
			if (error) {
				console.error(`Error executing command: ${error}`)
				reject(error)
				return
			}
			core.debug(`stdout: ${stdout}`)
			core.debug(`stderr: ${stderr}`)
			resolve()
		})
	})
}

// Function to fetch the branches
async function fetchBranch(branchName: string) {
	return new Promise<void>((resolve, reject) => {
		// Execute the git command to fetch the branch
		exec(`git fetch origin ${branchName}`, { cwd: process.cwd() }, (error, stdout, stderr) => {
			if (error) {
				console.error(`Error executing command: ${error}`)
				reject(error)
				return
			}
			core.debug(`stdout: ${stdout}`)
			core.debug(`stderr: ${stderr}`)
			resolve()
		})
	})
}

// Funtion to pull latest changes
async function pull() {
	return new Promise<void>((resolve, reject) => {
		// Execute the git command to pull the latest changes
		exec(`git pull`, { cwd: process.cwd() }, (error, stdout, stderr) => {
			if (error) {
				console.error(`Error executing command: ${error}`)
				reject(error)
				return
			}
			core.debug(`stdout: ${stdout}`)
			core.debug(`stderr: ${stderr}`)
			resolve()
		})
	})
}
