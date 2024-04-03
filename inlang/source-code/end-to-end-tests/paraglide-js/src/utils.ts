import type { ChildProcessWithoutNullStreams } from "node:child_process"

export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export function respondToPrompts(
	process: ChildProcessWithoutNullStreams,
	responses: Record<string, string>
) {
	const alreadyResponded = new Set<string>()
	return new Promise<void>((resolve, reject) => {
		process.stdout.on("data", (data) => {
			for (const [prompt, answer] of Object.entries(responses)) {
				if (data.toString().includes(prompt) && !alreadyResponded.has(prompt)) {
					process.stdin.write(answer)
					alreadyResponded.add(prompt)
				}
			}

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
