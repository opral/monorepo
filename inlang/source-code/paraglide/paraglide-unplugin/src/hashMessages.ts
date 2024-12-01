import { type Message, type ProjectSettings, normalizeMessage } from "@inlang/sdk"
import crypto from "node:crypto"

export function hashMessages(messages: readonly Message[], settings: ProjectSettings): string {
	const normalizedMessages = messages
		.map(normalizeMessage)
		.sort((a, b) => a.id.localeCompare(b.id, "en"))

	try {
		const hash = crypto.createHash("sha256")
		hash.update(JSON.stringify(normalizedMessages))
		hash.update(JSON.stringify(settings))
		return hash.digest("hex")
	} catch (e) {
		return crypto.randomUUID()
	}
}
