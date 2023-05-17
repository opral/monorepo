import { exec } from "node:child_process"
import { Command } from "commander"
import { log } from "../../utilities.js"
import { telemetryNode } from "@inlang/telemetry"

export const editor = new Command()
	.command("editor")
	.description("Open the Inlang editor for the current repository.")
	.action(editorCommandAction)

function editorCommandAction() {
	exec("git config --get remote.origin.url", (error, stdout) => {
		if (error) {
			log.error("Failed to get the remote URL.", error.message)
			return
		}

		const remoteUrl = stdout.trim()
		// Print out the remote URL
		log.info(`Remote URL: ${remoteUrl}`)

		const githubUrl = parseGithubUrl(remoteUrl)

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

			telemetryNode.capture({
				distinctId: "CLI",
				event: "CLI: open editor",
				properties: {
					inlangEditorUrl,
				},
			})

			log.info("✅ Opened the Inlang editor for the repository.")
		})
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
