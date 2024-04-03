import type { ChildProcessWithoutNullStreams } from "node:child_process"

export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export type PromptResponseMap = Record<
	string,
	{
		response: string

		/** Does this prompt HAVE to occur or is it optional */
		required: boolean
	}
>

export function respondToPrompts(
	process: ChildProcessWithoutNullStreams,
	responses: PromptResponseMap
) {
	const alreadyResponded = new Set<string>()
	const requiredPrompts = Object.entries(responses).filter(([, r]) => r.required)

	return new Promise<void>((resolve, reject) => {
		process.stdout.on("data", (data) => {
			for (const [prompt, { response }] of Object.entries(responses)) {
				if (data.toString().includes(prompt) && !alreadyResponded.has(prompt)) {
					// eslint-disable-next-line no-console
					console.log("responding to", prompt)
					process.stdin.write(response)
					alreadyResponded.add(prompt)
				}
			}

			// eslint-disable-next-line no-console
			console.log(data.toString())

			//if all required prompts have been responded
			if (requiredPrompts.every(([prompt]) => alreadyResponded.has(prompt))) {
				resolve()
			}

			//if we've responded to all prompts
			if (alreadyResponded.size === Object.keys(responses).length) {
				resolve()
			}
		})

		process.on("disconnect", () => {
			reject("disconnect")
		})

		process.on("exit", () => {
			reject("exit")
		})

		process.on("close", () => {
			reject("close")
		})
	})
}

export function kebabCase(str: string) {
	return str
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/\s+/g, "-")
		.toLowerCase()
}
