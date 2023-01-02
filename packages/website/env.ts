/**
 * --------------------------------
 * Env file and variables related code.
 * --------------------------------
 */

/**
 * Environment variables that are avaibale ONLY server-side.
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
	JWE_SECRET_KEY: string;

	/**
	 * https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#2-users-are-redirected-back-to-your-site-by-github
	 */
	GITHUB_APP_CLIENT_SECRET: string;

	/**
	 * The sentry dsn for the server.
	 *
	 * Only available in production.
	 */
	SENTRY_DSN_SERVER?: string;

	/**
	 * The API key for Google Translate.
	 *
	 * Only available in production.
	 * https://cloud.google.com/translate/docs/setup
	 */
	GOOGLE_TRANSLATE_API_KEY?: string;
};

/**
 * Environment variables that are available client-side.
 *
 * Read [vite's documenation](https://vitejs.dev/guide/env-and-mode.html#env-variables-and-modes)
 * for more information.
 */
export type ClientSideEnv = {
	/**
	 * The url of the proxy server for git requests.
	 */
	VITE_GIT_REQUEST_PROXY_PATH: string;
	/**
	 * The github app client id.
	 *
	 * Read more https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps
	 */
	VITE_GITHUB_APP_CLIENT_ID: string;

	/**
	 * The sentry dsn for the client.
	 *
	 * Only available in production.
	 */
	VITE_SENTRY_DSN_CLIENT?: string;
};

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
export const clientSideEnv: ClientSideEnv = import.meta
	.env as unknown as ClientSideEnv;

/**
 * Get server side env variables.
 *
 * _Example_
 * ```ts
 * 	 const env = serverSideEnv();
 * ```
 *
 * Client side env varibales are automatically included.
 */
export async function serverSideEnv(): Promise<ServerSideEnv> {
	try {
		// dynamically importing dotenv to avoid clash with client side code
		const dotenv = await import("dotenv");
		dotenv.config();
		return process.env as ServerSideEnv;
	} catch (e) {
		console.error(e);
		throw Error(
			"You likely tried to get server-side env variables from the client-side. Use `clientSideEnv() instead."
		);
	}
}

/**
 * Call this function as soon as possible to validate the env.
 *
 * Will throw an error if the env is invalid.
 */
export async function validateEnv() {
	const env = await serverSideEnv();
	// VITE_GIT_REQUEST_PROXY_PATH
	if (env.VITE_GIT_REQUEST_PROXY_PATH === undefined) {
		throw Error("Missing env variable VITE_CORS_PROXY_URL");
	} else if (
		env.VITE_GIT_REQUEST_PROXY_PATH.startsWith("/") === false ||
		env.VITE_GIT_REQUEST_PROXY_PATH.endsWith("/") === false
	) {
		throw Error(
			"VITE_CORS_PROXY_URL must be a local path like that starts and ends with a slash `/` like `/git-proxy/`."
		);
	}
	//
	else if (env.VITE_GITHUB_APP_CLIENT_ID === undefined) {
		throw Error("Missing env variable VITE_GITHUB_APP_CLIENT_ID");
	} else if (env.JWE_SECRET_KEY === undefined) {
		throw Error("Missing env variable JWE_SECRET_KEY");
	} else if (env.GITHUB_APP_CLIENT_SECRET === undefined) {
		throw Error("Missing env variable GITHUB_APP_CLIENT_SECRET");
	}
}
