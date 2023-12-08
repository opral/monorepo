export function getMessageIdFromPath(path: string) {
	const cleanedPath = path.replace(/\/$/, "") // This regex matches a trailing slash and replaces it with an empty string
	const pathParts = cleanedPath.split("/")
	const messageId = pathParts.at(-1)!
	return messageId
}

export function getPathFromMessageId(id: string) {
	return id
}

export function parseMessage(messageRaw: string) {
	return JSON.parse(messageRaw)
}
