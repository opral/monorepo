import { publicEnv } from "@inlang/env-variables/dist/runtime/publicEnv.js"

export type LixAuthModule = {
	login: () => Promise<any>
	logout: () => Promise<any>
	getUser: () => Promise<{
		username: string
		email: string
		avatarUrl?: string
	}>
	addPermissions: () => Promise<any>
}

const gitHubProxyUrl = publicEnv.PUBLIC_GIT_PROXY_BASE_URL + "/github-proxy/"
const githubAppClientId = publicEnv.PUBLIC_LIX_GITHUB_APP_CLIENT_ID

/**
 * Login user in new window.
 *
 * Read https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#1-request-a-users-github-identity
 * works only in browsers for now, but other methods should be supported in future
 */
// TODO: later use url with default instead of env var: args: { url?: string }
export async function login() {
	const loginWindow = window.open(
		`https://github.com/login/oauth/authorize?client_id=${githubAppClientId}`, // &redirect_uri=${
		"_blank"
	)

	await new Promise((resolve) => {
		const timer = setInterval(() => {
			if (loginWindow?.closed) {
				clearInterval(timer)
				resolve(true)
			}
		}, 700)
	})
}

export async function addPermissions() {
	const permissionWindow = window.open(
		`https://github.com/apps/${publicEnv.PUBLIC_LIX_GITHUB_APP_NAME}/installations/select_target`,
		"_blank"
	)
	await new Promise((resolve) => {
		const timer = setInterval(() => {
			if (permissionWindow?.closed) {
				clearInterval(timer)
				resolve(true)
			}
		}, 700)
	})
}

export async function logout() {
	await fetch(`${publicEnv.PUBLIC_GIT_PROXY_BASE_URL}/services/auth/sign-out`, {
		method: "POST",
		credentials: "include",
	})
}

type Email = {
	email: string
	primary: boolean
	verified: boolean
	visibility: string | undefined
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
		const maybeTokenInvalid = await email.text()
		if (maybeTokenInvalid === "token_invalid") {
			throw Error("token_invalid")
		} else {
			throw Error(email.statusText)
		}
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

export const browserAuth: LixAuthModule = { login, logout, getUser, addPermissions }
