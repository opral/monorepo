import { exec } from "node:child_process"
import { Command } from "commander"
import { parseOrigin } from "@inlang/telemetry"
import { log } from "../../utilities/log.js"
import { getGitRemotes } from "../../utilities/getGitRemotes.js"
import type { NodeishFilesystem } from "@inlang-git/fs"

export const editor = new Command()
	.command("editor")
	.description("Open the Inlang editor for the current repository.")
	.action(async () => {
		await editorCommandAction({ exec, logger: log })
	})

export async function editorCommandAction(args: {
	exec: any
	nodeishFs?: NodeishFilesystem
	filepath?: string
	logger: any
}) {
	const gitOrigin = parseOrigin({
		remotes: await getGitRemotes({ nodeishFs: args.nodeishFs, filepath: args.filepath }),
	})
	if (!gitOrigin) {
		args.logger.error("Failed to get the git origin.")
		return
	}

	// Print out the remote URL
	args.logger.info(`Origin URL: ${gitOrigin}`)

	const githubUrl = parseGithubUrl(gitOrigin)

	if (!githubUrl) {
		args.logger.error("Failed to parse the GitHub URL from the remote URL.")
		return
	}

	const inlangEditorUrl = `https://inlang.com/editor/${githubUrl}`

	let command
	let commandArgs

	if (process.platform === "win32") {
		// Windows
		command = "start"
		commandArgs = [inlangEditorUrl]
	} else if (process.platform === "darwin") {
		// macOS
		command = "open"
		commandArgs = [inlangEditorUrl]
	} else if (process.platform === "linux") {
		// linux
		command = "xdg-open"
		commandArgs = [inlangEditorUrl]
	} else {
		console.error("Unsupported platform: " + process.platform)
		return
	}

	args.exec(`${command} ${commandArgs.join(" ")}`, (error: Error) => {
		if (error) {
			args.logger.error("Failed to open the Inlang editor.", error.message)
			return
		}

		args.logger.info("✅ Opened the Inlang editor for the repository.")
	})
}

const parseGithubUrl = (url: string): string | undefined => {
	const regex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w-]+\/[\w-]+)(?:\.git)?$/
	const match = url.match(regex)

	if (match && match[1]) {
		return `github.com/${match[1]}`
	}

	return undefined
}
