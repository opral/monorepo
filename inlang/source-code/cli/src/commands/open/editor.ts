import { exec } from "node:child_process"
import { Command } from "commander"
import { log } from "../../utilities/log.js"
import fs from "node:fs/promises"
import { findRepoRoot, openRepository } from "@lix-js/client"
import type { NodeishFilesystem } from "@lix-js/fs"

export const editor = new Command()
	.command("editor")
	.description("Open the Inlang editor for the current repository.")
	.action(async () => {
		await editorCommandAction({ exec, nodeishFs: fs, path: process.cwd(), logger: log })
	})

export async function editorCommandAction(args: {
	exec: any
	nodeishFs: NodeishFilesystem
	path: string
	logger: any
}) {
	let repoRoot: string | undefined
	try {
		repoRoot = await findRepoRoot({ nodeishFs: args.nodeishFs, path: args.path })
		if (!repoRoot) {
			args.logger.error("Failed to find repository root.")
			return
		}
	} catch (error) {
		args.logger.error("Failed to find repository root.")
		return
	}

	const repo = await openRepository(repoRoot, { nodeishFs: args.nodeishFs })
	const origin = await repo.getOrigin()

	// Print out the remote URL
	args.logger.info(`Origin URL: ${origin}`)

	const githubUrl = parseGithubUrl(origin)

	if (!githubUrl) {
		args.logger.error("Failed to parse the GitHub URL from the remote URL.")
		return
	}

	const inlangEditorUrl = `https://fink.inlang.com/${githubUrl}`

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

const parseGithubUrl = (url: string | undefined): string | undefined => {
	if (!url) {
		return undefined
	}
	const regex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w-]+\/[\w-]+)(?:\.git)?$/
	const match = url.match(regex)

	if (match && match[1]) {
		return `github.com/${match[1]}`
	}

	return undefined
}
