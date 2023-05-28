import { exec } from "node:child_process"
import { Command } from "commander"
import { log } from "../../utilities.js"
import { getGitRemotes } from "../../utilities/getGitRemotes.js"
import { parseOrigin } from "@inlang/telemetry"

export const editor = new Command()
	.command("editor")
	.description("Open the Inlang editor for the current repository.")
	.action(editorCommandAction)

async function editorCommandAction() {
	const gitOrigin = parseOrigin({ remotes: await getGitRemotes() })
	if (!gitOrigin) {
		log.error("Failed to get the git origin.")
		return
	}

	// Print out the remote URL
	log.info(`Origin URL: ${gitOrigin}`)

	const githubUrl = parseGithubUrl(gitOrigin)

	if (!githubUrl) {
		log.error("Failed to parse the GitHub URL from the remote URL.")
		return
	}

	const inlangEditorUrl = `https://inlang.com/editor/${githubUrl}`

	exec(`open ${inlangEditorUrl}`, (error) => {
		if (error) {
			log.error("Failed to open the Inlang editor.", error.message)
			return
		}

		log.info("✅ Opened the Inlang editor for the repository.")
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
