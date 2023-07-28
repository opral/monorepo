import type { Result } from "@inlang/core/utilities"

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
				return ["already subscribed"]
			} else {
				return [undefined, new Error(response.statusText)]
			}
		} else {
			return ["success"]
		}
	} catch (error) {
		return [undefined, error as Error]
	}
}
