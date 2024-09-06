import type { Result } from "../types.js"

export async function subscribeNewsletter(args: { email: string }): Promise<Result<string, Error>> {
	try {
		const response = await fetch("https://hook.eu2.make.com/lt52ew79dojhjj5yneo2lf9pv92sihjj", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email: args.email }),
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
