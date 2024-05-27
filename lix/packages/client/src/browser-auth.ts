type getAuthClientArgs = {
	gitHubProxyBaseUrl: string
	githubAppName: string
	githubAppClientId: string
}

export function getAuthClient({
	gitHubProxyBaseUrl,
	githubAppName,
	githubAppClientId,
}: getAuthClientArgs) {
	const gitHubProxyUrl = gitHubProxyBaseUrl + "/github-proxy/"
	return {
		/**
		 * Login user in new window.
		 *
		 * Read https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#1-request-a-users-github-identity
		 * works only in browsers for now, but other methods should be supported in future
		 */
		async login({ redirect } = { redirect: "" }) {
			const loginWindow = window.open(
				`https://github.com/login/oauth/authorize?client_id=${githubAppClientId}${
					redirect ? "&state=" + encodeURI(redirect) : ""
				}`,
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
		},

		async addPermissions() {
			const permissionWindow = window.open(
				`https://github.com/apps/${githubAppName}/installations/select_target`,
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
		},

		async logout() {
			await fetch(`${gitHubProxyBaseUrl}/services/auth/sign-out`, {
				method: "POST",
				credentials: "include",
			})
		},

		/**
		 * Get the user info from the GitHub API.
		 *
		 * Read https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-the-authenticated-user
		 *
		 * @throws
		 */
		async getUser(): Promise<{
			username: string
			email: string
			avatarUrl?: string
		}> {
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
		},
	}
}

// Type declaration for github api
type Email = {
	email: string
	primary: boolean
	verified: boolean
	visibility: string | undefined
}
