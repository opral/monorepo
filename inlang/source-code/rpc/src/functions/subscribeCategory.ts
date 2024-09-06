import type { Result } from "../types.js"

export async function subscribeCategory(args: {
	category: string
	email: string
}): Promise<Result<string, Error>> {
	try {
		const response = await fetch("https://hook.eu2.make.com/kdhcfe1i5mx2ssmgmp0v748yo7dh6hlb", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ category: args.category, email: args.email }),
		})
		if (!response.ok) {
			if (response.status === 409) {
				return { data: "already subscribed" }
			} else {
				return { error: new Error(response.statusText) }
			}
		} else {
			return { data: "success" }
		}
	} catch (error) {
		return { error: error as Error }
	}
}
