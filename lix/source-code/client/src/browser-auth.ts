import { publicEnv } from "@inlang/env-variables"

const gitHubProxyUrl = publicEnv.PUBLIC_GIT_PROXY_BASE_URL + "/github-proxy/"

// the authUrl for the oauth app with minimal scopes https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps
// oauth apps can only require public (public_repo) or private repos but no further repo or org selection
// email is required to commit with identity of who committed
const authUrl = `https://github.com/login/oauth/authorize?client_id=${publicEnv.PUBLIC_GITHUB_APP_CLIENT_ID}&scope=repo,user:email`

/**
 * Login user in new window.
 *
 * Read https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#1-request-a-users-github-identity
 * works only in browsers for now, but other methods should be supported in future
 */
// TODO: later use url with default instead of env var: args: { url?: string }
export function login() {
	window.open(authUrl, "_blank")
}
export function logout() {
	return fetch(`${publicEnv.PUBLIC_GIT_PROXY_BASE_URL}/services/auth/sign-out`, {
		method: "POST",
		credentials: "include",
	})
}

type Email = {
	email: string
	primary: boolean
	verified: boolean
	visibility: string | null
}

/**
 * Get the user info from the GitHub API.
 *
 * Read https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-the-authenticated-user
 *
 * @throws
 */
export async function getUser() {
	const getGithubNoReplyEmail = (emails: Email[]): string | undefined => {
		const githubNoReplyEmail = emails.find((email) =>
			email.email.endsWith("@users.noreply.github.com")
		)
		return githubNoReplyEmail?.email
	}

	const getGithubPublicEmail = (emails: Email[]): string | undefined => {
		const githubPublicEmail = emails.find((email) => email.visibility === "public")
		return githubPublicEmail?.email
	}

	const getGithubPrimaryEmail = (emails: Email[]): string => {
		const githubPrimaryEmail = emails.find((email) => email.primary)
		if (githubPrimaryEmail === undefined) {
			throw Error("No public email found")
		}
		return githubPrimaryEmail.email
	}

	const email = await fetch(`${gitHubProxyUrl}https://api.github.com/user/emails`, {
		credentials: "include",
		headers: {
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
		},
	})
	if (email.ok === false) {
		throw Error("Failed to get user email " + email.statusText)
	}
	const emailBody = await email.json()

	const userEmail =
		getGithubNoReplyEmail(emailBody) ||
		getGithubPublicEmail(emailBody) ||
		getGithubPrimaryEmail(emailBody)

	const request = await fetch(`${gitHubProxyUrl}https://api.github.com/user`, {
		credentials: "include",
		headers: {
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
		},
	})
	if (request.ok === false) {
		throw Error("Failed to get user info " + request.statusText)
	}
	const requestBody = await request.json()

	return {
		username: requestBody.login,
		email: userEmail,
		avatarUrl: requestBody.avatar_url,
	}
}

export default { login, logout, getUser }
