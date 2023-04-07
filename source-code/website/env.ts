/**
 * --------------------------------
 * Env file and variables related code.
 *
 * Create an `.env` file that contains the variables
 * defined in the schemas below.
 * --------------------------------
 */

/**
 * The flag is set in the package.json scripts
 * via `NODE_ENV=production <command>`
 */
export const isProduction = process.env.NODE_ENV === "production"

/**
 * Environment variables that are available ONLY server-side.
 *
 * Server-side env variables include client-side env variables.
 *
 * _Example_
 * ```ts
 * 	const env = getServerSideEnv();
 * ```
 */
export type ServerSideEnv = ClientSideEnv & {
	/**
	 * The secret key used to encrypt and decrypt JWEs.
	 */
	JWE_SECRET_KEY: string

	/**
	 * https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#2-users-are-redirected-back-to-your-site-by-github
	 */
	GITHUB_APP_CLIENT_SECRET: string

	/**
	 * The sentry dsn for the server.
	 *
	 * Only available in production.
	 */
	SENTRY_DSN_SERVER?: string

	/**
	 * The secret for signing cookies.
	 */
	COOKIE_SECRET: string
}

/**
 * Environment variables that are available client-side.
 *
 * Read [vite's documentation](https://vitejs.dev/guide/env-and-mode.html#env-variables-and-modes)
 * for more information.
 */
export type ClientSideEnv = {
	/**
	 * The url of the proxy server for git requests.
	 */
	VITE_GIT_REQUEST_PROXY_PATH: string
	/**
	 * The github app client id.
	 *
	 * Read more https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps
	 */
	VITE_GITHUB_APP_CLIENT_ID: string

	/**
	 * The sentry dsn for the client.
	 *
	 * Only available in production.
	 */
	VITE_SENTRY_DSN_CLIENT?: string
}

/**
 * Get client-side env variables.
 *
 * _Example_
 * ```ts
 * 	 clientSideEnv.VITE_CORS_PROXY_URL;
 * ```
 *
 * Use `getServerSideEnv` for server-side env variables.
 */
export const clientSideEnv: ClientSideEnv = import.meta.env as unknown as ClientSideEnv

/**
 * Get server side env variables.
 *
 * _Example_
 * ```ts
 * 	 const env = serverSideEnv();
 * ```
 *
 * Client side env variables are automatically included.
 */
export async function serverSideEnv(): Promise<ServerSideEnv> {
	try {
		// dynamically importing dotenv to avoid clash with client side code
		const dotenv = await import("dotenv")
		dotenv.config()
		return process.env as ServerSideEnv
	} catch (e) {
		console.error(e)
		throw Error(
			"You likely tried to get server-side env variables from the client-side. Use `clientSideEnv() instead.",
		)
	}
}

class EnvironmentVariableMissingError extends Error {
	readonly #id = "EnvironmentVariableMissingError"

	constructor(variableName: string) {
		super(`Missing environment variable '${variableName}'`)
	}
}

/**
 * Call this function as soon as possible to validate the env.
 *
 * Will throw an error if the env is invalid.
 */
export async function validateEnv() {
	const env = await serverSideEnv()
	// VITE_GIT_REQUEST_PROXY_PATH
	if (env.VITE_GIT_REQUEST_PROXY_PATH === undefined) {
		throw new EnvironmentVariableMissingError("VITE_CORS_PROXY_URL")
	} else if (
		env.VITE_GIT_REQUEST_PROXY_PATH.startsWith("/") === false ||
		env.VITE_GIT_REQUEST_PROXY_PATH.endsWith("/") === false
	) {
		throw new Error(
			"VITE_CORS_PROXY_URL must be a local path like that starts and ends with a slash `/` like `/git-proxy/`.",
		)
	}
	//
	else if (env.VITE_GITHUB_APP_CLIENT_ID === undefined) {
		throw new EnvironmentVariableMissingError("VITE_GITHUB_APP_CLIENT_ID")
	} else if (env.JWE_SECRET_KEY === undefined) {
		throw new EnvironmentVariableMissingError("JWE_SECRET_KEY")
	} else if (env.GITHUB_APP_CLIENT_SECRET === undefined) {
		throw new EnvironmentVariableMissingError("GITHUB_APP_CLIENT_SECRET")
	} else if (env.COOKIE_SECRET === undefined) {
		throw new EnvironmentVariableMissingError("COOKIE_SECRET")
	}
	if (isProduction) {
		if (env.VITE_SENTRY_DSN_CLIENT === undefined) {
			throw new EnvironmentVariableMissingError("VITE_SENTRY_DSN_CLIENT")
		} else if (env.SENTRY_DSN_SERVER === undefined) {
			throw new EnvironmentVariableMissingError("SENTRY_DSN_SERVER")
		}
	}
}
