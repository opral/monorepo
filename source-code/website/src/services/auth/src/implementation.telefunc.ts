import type { LocalStorageSchema } from "../../../services/local-storage/index.js"
import { getContext } from "telefunc"

interface Email {
	email: string
	primary: boolean
	verified: boolean
	visibility: string | null
}

const getGithubNoReplyEmail = (emails: Email[]): string => {
	const githubNoReplyEmail = emails.find((email) =>
		email.email.endsWith("@users.noreply.github.com"),
	)
	if (githubNoReplyEmail === undefined) {
		throw Error("No GitHub no-reply email found")
	}
	return githubNoReplyEmail.email
}

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

	// Email
	const email = await fetch("https://api.github.com/user/emails", {
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${context.githubAccessToken}`,
			"X-GitHub-Api-Version": "2022-11-28",
		},
	})
	if (email.ok === false) {
		throw Error("Failed to get user email " + email.statusText)
	}
	const emailBody = await email.json()
	console.log("emailBody", emailBody)

	const noReplyEmail = getGithubNoReplyEmail(emailBody)

	//console.log("noReplyEmail", noReplyEmail)

	// Request
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
		email: noReplyEmail,
		avatarUrl: requestBody.avatar_url,
	}
}
