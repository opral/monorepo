/**
 * The endpoint for the api call shared with the .server.ts file.
 */
export const ENDPOINT = "/shared/rest/get-translation"

/**
 * Translate a string and return the tranlation with Google API
 */
export async function getTranslation() {
	const response = await fetch("http://localhost:3000" + ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ moin: "test" }),
	})
	console.log(response)
}
