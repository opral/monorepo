export function getMessageIdFromPath(path: string) {
	const cleanedPath = path.replace(/\/$/, "") // This regex matches a trailing slash and replaces it with an empty string
	const pathParts = cleanedPath.split("/")
	const messageFileName = pathParts.at(-1)!
	const messageId = messageFileName.split(".").at(0)!
	return messageId
}

export function getPathFromMessageId(id: string) {
	return id + ".json"
}

export function parseMessage(messageRaw: string) {
	return JSON.parse(messageRaw)
}

export function encodeMessage(message: Message) {
	return JSON.stringify(message, undefined, 4)
}
