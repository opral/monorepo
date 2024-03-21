import * as fs from "node:fs/promises"
import * as core from "@actions/core"
import * as github from "@actions/github"
import { openRepository } from "@lix-js/client"
import {
	loadProject,
	type InstalledMessageLintRule,
	type MessageLintReport,
	listProjects,
} from "@inlang/sdk"
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
		const { owner, repo } = github.context.repo
		const prNumber = github.context.payload.pull_request?.number

		const repoBase = await openRepository("file://" + process.cwd(), {
			nodeishFs: fs,
			branch: github.context.payload.pull_request?.head.ref,
		})
		const projectListBase = await listProjects(repoBase.nodeishFs, process.cwd())
		const results = projectListBase.map((project) => ({
			projectPath: project.projectPath.replace(process.cwd(), ""),
			errorsBase: [] as any[],
			errorsHead: [] as any[],
			installedRules: [] as InstalledMessageLintRule[],
			reportsBase: [] as MessageLintReport[],
			reportsHead: [] as MessageLintReport[],
			lintSummary: [] as { id: string; name: string; count: number }[],
			changedIds: [] as string[],
			commentContent: "" as string,
		}))

		// Collect all reports from the base repository
		for (const result of results) {
			core.debug(`Checking project: ${result.projectPath}`)
			const projectBase = await loadProject({
				projectPath: process.cwd() + result.projectPath,
				repo: repoBase,
				appId: "app.inlang.ninjaI18nAction",
			})
			if (projectBase.errors().length > 0) {
				if (result) result.errorsBase = projectBase.errors()
				console.debug("Skip project ", result.projectPath, " in base repo because of errors")
				continue
			}
			result.installedRules.push(...projectBase.installed.messageLintRules())
			result.reportsBase.push(...projectBase.query.messageLintReports.getAll())
		}

		// Collect meta data for head and base repository
		const headMeta = {
			owner: github.context.payload.pull_request?.head.label.split(":")[0],
			repo: github.context.payload.pull_request?.head.repo.name,
			branch: github.context.payload.pull_request?.head.label.split(":")[1],
			link: github.context.payload.pull_request?.head.repo.html_url,
		}
		const baseMeta = {
			owner: github.context.payload.pull_request?.base.label.split(":")[0],
			repo: repo,
			branch: github.context.payload.pull_request?.base.label.split(":")[1],
			link: github.context.payload.pull_request?.base.repo.html_url,
		}

		const isFork = headMeta.owner !== baseMeta.owner
		core.debug(`Is fork: ${isFork}`)

		// Prepare head repo
		let repoHead
		if (isFork) {
			core.debug("Fork detected, cloning head repository")
			process.chdir("../../../")
			await cloneRepository(headMeta)
			process.chdir(headMeta.repo)
			repoHead = await openRepository("file://" + process.cwd(), {
				nodeishFs: fs,
			})
		} else {
			core.debug("Fork not detected, fetching and checking out head repository")
			await fetchBranch(headMeta.branch)
			await checkoutBranch(headMeta.branch)
			await pull()
			repoHead = await openRepository("file://" + process.cwd(), {
				nodeishFs: fs,
				branch: headMeta.branch,
			})
		}

		// Check if the head repository has a new project compared to the base repository
		const projectListHead = await listProjects(repoHead.nodeishFs, process.cwd())
		const newProjects = projectListHead.filter(
			(project) =>
				!results.some(
					(result) => result.projectPath === project.projectPath.replace(process.cwd(), "")
				)
		)
		// Add new projects to the results
		for (const project of newProjects) {
			results.push({
				projectPath: project.projectPath.replace(process.cwd(), ""),
				errorsBase: [] as any[],
				errorsHead: [] as any[],
				installedRules: [] as InstalledMessageLintRule[],
				reportsBase: [] as MessageLintReport[],
				reportsHead: [] as MessageLintReport[],
				lintSummary: [] as { id: string; name: string; count: number }[],
				changedIds: [] as string[],
				commentContent: "" as string,
			})
		}

		// Collect all reports from the head repository
		for (const result of results) {
			// Check if project is found in head repo
			if (
				projectListHead.some(
					(project) => project.projectPath.replace(process.cwd(), "") === result.projectPath
				) === false
			) {
				console.debug(`Project ${result.projectPath} not found in head repo`)
				continue
			}
			const projectHead = await loadProject({
				projectPath: process.cwd() + result.projectPath,
				repo: repoHead,
				appId: "app.inlang.ninjaI18nAction",
			})
			if (projectHead.errors().length > 0) {
				if (result) result.errorsHead = projectHead.errors()
				console.debug("Skip project ", result.projectPath, " in head repo because of errors")
				continue
			}
			// Extend installedRules with new rules
			const newInstalledRules = projectHead.installed.messageLintRules()
			for (const newRule of newInstalledRules) {
				if (!result.installedRules.some((rule) => rule.id === newRule.id)) {
					result.installedRules.push(newRule)
				}
			}
			result?.reportsHead.push(...projectHead.query.messageLintReports.getAll())
		}

		// Create a lint summary for each project
		for (const result of results) {
			if (result.errorsHead.length > 0) continue
			const LintSummary = createLintSummary(
				result.reportsHead,
				result.reportsBase,
				result.installedRules
			)
			result.lintSummary = LintSummary.summary
			result.changedIds = LintSummary.changedIds
		}

		// Create a comment content for each project
		for (const result of results) {
			const shortenedProjectPath = () => {
				const parts = result.projectPath.split("/")
				if (parts.length > 2) {
					return `/${parts.at(-2)}/${parts.at(-1)}`
				} else {
					return result.projectPath
				}
			}
			// Case: New errors in project setup
			if (result.errorsBase.length === 0 && result.errorsHead.length > 0) {
				result.commentContent = `#### ❗️ New errors in setup of project \`${shortenedProjectPath()}\` found
${result.errorsHead
	.map((error) => {
		let errorLog = `<details>
<summary>${error?.name}</summary>
${error?.message}`
		if (error?.cause && error?.cause?.message) {
			errorLog += `\n\n**Error cause**
${error?.cause.message}`
		}
		if (error?.cause && error?.cause?.message && error?.cause?.stack) {
			errorLog += `\n\n**Stack trace**
${error?.cause.stack}`
		}
		errorLog += `</details>`
		return errorLog
	})
	.join("\n")}`
				continue
			}
			// Case: setup of project fixed -> no comment
			if (result.errorsBase.length > 0 && result.errorsHead.length === 0) {
				console.debug(`#### ✅ Setup of project \`${result.projectPath}\` fixed`)
			}
			// Case: No lint reports found -> no comment
			if (result.errorsBase.length > 0 || result.errorsHead.length > 0) continue
			if (result.lintSummary.length === 0) continue
			// Case: Lint reports found -> create comment with lint summary
			const lintSummary = result.lintSummary
			const commentContent = `#### Project \`${shortenedProjectPath()}\`
| lint rule | new reports | link |
|-----------|-------------|------|
${lintSummary
	.map(
		(lintSummary) =>
			`| ${lintSummary.name} | ${
				lintSummary.count
			} | [contribute (via Fink 🐦)](https://fink.inlang.com/github.com/${headMeta.owner}/${
				headMeta.repo
			}?branch=${headMeta.branch}&project=${result.projectPath}&lint=${
				lintSummary.id
			}&${result.changedIds.map((id) => `id=${id}`).join("&")}&ref=ninja-${baseMeta.owner}/${
				baseMeta.repo
			}/pull/${prNumber}) |`
	)
	.join("\n")}
`
			result.commentContent = commentContent
		}

		const commentHeadline = `### 🥷 Ninja i18n – 🛎️ Translations need to be updated`
		const commentResolved = `### 🥷 Ninja i18n – 🎉 Translations have been successfully updated`
		const commentContent =
			commentHeadline +
			"\n\n" +
			results
				.map((result) => result.commentContent)
				.filter((content) => content.length > 0)
				.join("\n")

		const octokit = github.getOctokit(token)
		const issue = await octokit.rest.issues.get({
			owner,
			repo,
			issue_number: prNumber as number,
		})
		if (issue.data.locked) return console.debug("PR is locked, comment is skipped")

		// Check if PR already has a comment from this action
		const existingComment = await octokit.rest.issues.listComments({
			owner,
			repo,
			issue_number: prNumber as number,
		})
		if (existingComment.data.length > 0) {
			const commentId = existingComment.data.find(
				(comment) =>
					(comment.body?.includes(commentHeadline) || comment.body?.includes(commentResolved)) &&
					comment.user?.login === "github-actions[bot]"
			)?.id
			if (commentId) {
				core.debug("Updating existing comment")
				if (results.every((result) => result.commentContent.length === 0)) {
					core.debug("Reports have been fixed, updating comment and removing it")
					await octokit.rest.issues.updateComment({
						owner,
						repo,
						comment_id: commentId,
						body: commentResolved,
						as: "ninja-i18n",
					})
					return
				} else {
					core.debug("Reports have not been fixed, updating comment")
					await octokit.rest.issues.updateComment({
						owner,
						repo,
						comment_id: commentId,
						body: commentContent,
						as: "ninja-i18n",
					})
				}
				return
			}
		}

		if (results.every((result) => result.commentContent.length === 0)) {
			core.debug("No lint reports found, skipping comment")
			return
		}

		core.debug("Creating a new comment")
		await octokit.rest.issues.createComment({
			owner,
			repo,
			issue_number: prNumber as number,
			body: commentContent,
			as: "ninja-i18n",
		})
	} catch (error) {
		// Fail the workflow run if an error occurs
		if (error instanceof Error) core.setFailed(error)
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
	const changedIds = diffReports
		.map((report) => report.messageId)
		.filter((value, index, self) => self.indexOf(value) === index)

	return { summary, changedIds }
}

// All functions below will be replaced by the @lix-js/client package in the future

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

// Function to clone the head repository
async function cloneRepository(repoData: { link: string; branch: string }) {
	return new Promise<void>((resolve, reject) => {
		// Execute the git command to clone the head repository
		exec(
			`git clone -b ${repoData.branch} --single-branch --depth 1 ${repoData.link}`, // Clone only the latest commit
			{ cwd: process.cwd() },
			(error, stdout, stderr) => {
				if (error) {
					console.error(`Error executing command: ${error}`)
					reject(error)
					return
				}
				core.debug(`stdout: ${stdout}`)
				core.debug(`stderr: ${stderr}`)
				resolve()
			}
		)
	})
}
