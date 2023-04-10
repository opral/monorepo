import type { LocalStorageSchema } from "../../../services/local-storage/index.js"
import { getContext } from "telefunc"

/**
 * Get the user info from the GitHub API.
 *
 * Read https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-the-authenticated-user
 *
 * @throws
 */
export async function getUserInfo(): Promise<LocalStorageSchema["user"] | undefined> {
	const context = getContext()
	if (context.githubAccessToken === undefined) {
		return undefined
	}
	const request = await fetch("https://api.github.com/user", {
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${context.githubAccessToken}`,
			"X-GitHub-Api-Version": "2022-11-28",
		},
	})
	if (request.ok === false) {
		throw Error("Failed to get user info " + request.statusText)
	}
	const requestBody = await request.json()
	return {
		username: requestBody.login,
		avatarUrl: requestBody.avatar_url,
	}
}
