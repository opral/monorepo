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

		// Change into the target repository
		process.chdir("target")
		const repoTarget = await openRepository("file://" + process.cwd(), {
			nodeishFs: fs,
			branch: github.context.payload.pull_request?.head.ref,
		})
		const projectListTarget = await listProjects(repoTarget.nodeishFs, process.cwd())

		const results = projectListTarget.map((project) => ({
			projectPath: project.projectPath.replace(process.cwd(), ""),
			errorsTarget: [] as any[],
			errorsMerge: [] as any[],
			installedRules: [] as InstalledMessageLintRule[],
			reportsTarget: [] as MessageLintReport[],
			reportsMerge: [] as MessageLintReport[],
			lintSummary: [] as { id: string; name: string; count: number; level: "warning" | "error" }[],
			changedIds: [] as string[],
			commentContent: "" as string,
		}))

		// Collect all reports from the target repository
		for (const result of results) {
			core.debug(`Checking project: ${result.projectPath}`)
			const projectTarget = await loadProject({
				projectPath: process.cwd() + result.projectPath,
				repo: repoTarget,
				appId: "app.inlang.ninjaI18nAction",
			})
			if (projectTarget.errors().length > 0) {
				if (result) result.errorsTarget = projectTarget.errors()
				console.debug("Skip project ", result.projectPath, " in base repo because of errors")
				continue
			}
			result.installedRules.push(...projectTarget.installed.messageLintRules())
			result.reportsTarget.push(...(await projectTarget.query.messageLintReports.getAll()))
		}

		// Collect meta data for head and base repository
		const headMeta = {
			owner: github.context.payload.pull_request?.head.label.split(":")[0],
			repo: github.context.payload.pull_request?.head.repo.name,
			branch: github.context.payload.pull_request?.head.label.split(":")[1],
		}
		const baseMeta = {
			owner: github.context.payload.pull_request?.base.label.split(":")[0],
			repo: repo,
			branch: github.context.payload.pull_request?.base.label.split(":")[1],
		}

		const isFork = headMeta.owner !== baseMeta.owner
		core.debug(`Is fork: ${isFork}`)

		// Prepare merge repo
		process.chdir("../merge")
		const repoMerge = await openRepository("file://" + process.cwd(), {
			nodeishFs: fs,
		})

		// Check if the merge repository has a new project compared to the target repository
		const projectListMerge = await listProjects(repoMerge.nodeishFs, process.cwd())
		const newProjects = projectListMerge.filter(
			(project) =>
				!results.some(
					(result) => result.projectPath === project.projectPath.replace(process.cwd(), "")
				)
		)
		// Add new projects to the results
		for (const project of newProjects) {
			results.push({
				projectPath: project.projectPath.replace(process.cwd(), ""),
				errorsTarget: [] as any[],
				errorsMerge: [] as any[],
				installedRules: [] as InstalledMessageLintRule[],
				reportsTarget: [] as MessageLintReport[],
				reportsMerge: [] as MessageLintReport[],
				lintSummary: [] as {
					id: string
					name: string
					count: number
					level: "warning" | "error"
				}[],
				changedIds: [] as string[],
				commentContent: "" as string,
			})
		}

		// Collect all reports from the merge repository
		for (const result of results) {
			// Check if project is found in merge repo
			if (
				projectListMerge.some(
					(project) => project.projectPath.replace(process.cwd(), "") === result.projectPath
				) === false
			) {
				console.debug(`Project ${result.projectPath} not found in head repo`)
				continue
			}
			const projectMerge = await loadProject({
				projectPath: process.cwd() + result.projectPath,
				repo: repoMerge,
				appId: "app.inlang.ninjaI18nAction",
			})
			if (projectMerge.errors().length > 0) {
				if (result) result.errorsMerge = projectMerge.errors()
				console.debug("Skip project ", result.projectPath, " in head repo because of errors")
				continue
			}
			// Extend installedRules with new rules
			const newInstalledRules = projectMerge.installed.messageLintRules()
			for (const newRule of newInstalledRules) {
				if (!result.installedRules.some((rule) => rule.id === newRule.id)) {
					result.installedRules.push(newRule)
				}
			}
			result?.reportsMerge.push(...(await projectMerge.query.messageLintReports.getAll()))
		}

		// Workflow should fail
		let projectWithNewSetupErrors = false
		let projectWithNewLintErrors = false

		// Create a lint summary for each project
		for (const result of results) {
			if (result.errorsMerge.length > 0) continue
			const LintSummary = createLintSummary(
				result.reportsMerge,
				result.reportsTarget,
				result.installedRules
			)
			if (result.projectPath === "/project.inlang") {
				console.log("ReportsTarget: ", result.reportsTarget.length)
				console.log("ReportsMerge: ", result.reportsMerge.length)
				console.log("LintSummary: ", LintSummary.summary)
			}
			if (LintSummary.summary.some((lintSummary) => lintSummary.level === "error")) {
				console.debug(
					`❗️ New lint errors found in project ${result.projectPath}. Set workflow to fail.`
				)
				projectWithNewLintErrors = true
			}
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
			if (result.errorsTarget.length === 0 && result.errorsMerge.length > 0) {
				console.debug(
					`❗️ New errors in setup of project \`${result.projectPath}\` found. Set workflow to fail.`
				)
				projectWithNewSetupErrors = true
				result.commentContent = `#### ❗️ New errors in setup of project \`${shortenedProjectPath()}\` found
${result.errorsMerge
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
			// Case: setup of project fixed -> comment with new lint reports
			if (result.errorsTarget.length > 0 && result.errorsMerge.length === 0) {
				console.debug(`✅ Setup of project \`${result.projectPath}\` fixed`)
			}
			// Case: No lint reports found -> no comment
			if (result.errorsMerge.length > 0) continue
			if (result.lintSummary.length === 0) continue
			// Case: Lint reports found -> create comment with lint summary
			const lintSummary = result.lintSummary
			const commentContent = `#### Project \`${shortenedProjectPath()}\`
| lint rule | new reports | level | link |
|-----------|-------------| ------|------|
${lintSummary
	.map(
		(lintSummary) =>
			`| ${lintSummary.name} | ${lintSummary.count}| ${
				lintSummary.level
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

		const commentMergeline = `### 🥷 Ninja i18n – 🛎️ Translations need to be updated`
		const commentResolved = `### 🥷 Ninja i18n – 🎉 Translations have been successfully updated`
		const commentContent =
			commentMergeline +
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
					(comment.body?.includes(commentMergeline) || comment.body?.includes(commentResolved)) &&
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

		// Fail the workflow if new lint errors or project setup errors exist
		console.log("projectWithNewSetupErrors", projectWithNewSetupErrors)
		console.log("projectWithNewLintErrors", projectWithNewLintErrors)
		if (projectWithNewSetupErrors || projectWithNewLintErrors) {
			let error_message = ""
			if (projectWithNewSetupErrors && projectWithNewLintErrors) {
				error_message = "New errors found in project setup and new lint errors found in project"
			} else if (projectWithNewSetupErrors) {
				error_message = "New errors found in project setup"
			} else if (projectWithNewLintErrors) {
				error_message = "New lint errors found in project"
			}
			core.setFailed(error_message)
		}
	} catch (error) {
		// Fail the workflow run if an error occurs
		if (error instanceof Error) core.setFailed(error)
	}
}

export default run

function createLintSummary(
	reportsMerge: MessageLintReport[],
	reportsTarget: MessageLintReport[],
	installedRules: InstalledMessageLintRule[]
) {
	const summary: { id: string; name: string; count: number; level: "error" | "warning" }[] = []
	const diffReports = reportsMerge.filter(
		(report) =>
			!reportsTarget.some(
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
		const level = installedRule.level
		if (count > 0) {
			summary.push({ id, name, count: count, level })
		}
	}
	const changedIds = diffReports
		.map((report) => report.messageId)
		.filter((value, index, self) => self.indexOf(value) === index)

	return { summary, changedIds }
}
