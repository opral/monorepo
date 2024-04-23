export const initializeLanguage = () => {
	if (process.env.NODE_ENV === "development")
		throw new Error("initializeLanguage is not available on the client")
}
