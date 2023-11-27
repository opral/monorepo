const quotedString = /^(['"`])(.*?)\1$/

export const isQuoted = (message: string) => quotedString.test(message)

export const stripQuotes = (message: string) => {
	const match = quotedString.exec(message)
	return match ? match[2] || message : message
}
