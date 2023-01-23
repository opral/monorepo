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

	/**
	 * The connection uri for super tokens.
	 * Only required in production or when using super tokens in dev by setting VITE_SUPERTOKENS_IN_DEV to 'true'.
	 */
	SUPERTOKENS_CONNECTION_URI?: string;

	/**
	 * The API key for super tokens.
	 * Only required in production or when using super tokens in dev by setting VITE_SUPERTOKENS_IN_DEV to 'true'.
	 */
	SUPERTOKENS_API_KEY?: string;
};

/**
 * Environment variables that are available client-side.
 *
 * Read [vite's documenation](https://vitejs.dev/guide/env-and-mode.html#env-variables-and-modes)
 * for more information.
 */
export type ClientSideEnv = {
	/**
	 * The environment mode.
	 */
	NODE_ENV: "development" | "production" | "test";

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

	/**
	 * The name of the super tokens app.
	 * Defaults to `inlang`.
	 */
	VITE_SUPERTOKENS_APP_NAME?: string;

	/**
	 * Set to `true` to enable super tokens in your dev environment.
	 *
	 * Only affecting the dev.
	 */
	VITE_SUPERTOKENS_IN_DEV?: string;
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
 * Validate a single env variable.
 * @param name The name of the env variable.
 * @param value The value of the env variable.
 * @throws Error if the env variable is invalid.
 */
const validateSingle = (name: string, value?: string) => {
	if (value === undefined) {
		throw Error(`Missing env variable ${name}`);
	}
};

const validateSupertokens = (env: ServerSideEnv) => {
	validateSingle("SUPERTOKENS_API_KEY", env.SUPERTOKENS_API_KEY);
	validateSingle("SUPERTOKENS_CONNECTION_URI", env.SUPERTOKENS_CONNECTION_URI);
};

/**
 * Call this function as soon as possible to validate the env.
 *
 * Will throw an error if the env is invalid.
 */
export async function validateEnv() {
	const env = await serverSideEnv();

	validateSingle(
		"VITE_GIT_REQUEST_PROXY_PATH",
		env.VITE_GIT_REQUEST_PROXY_PATH
	);
	validateSingle("VITE_GITHUB_APP_CLIENT_ID", env.VITE_GITHUB_APP_CLIENT_ID);
	validateSingle("JWE_SECRET_KEY", env.JWE_SECRET_KEY);
	validateSingle("GITHUB_APP_CLIENT_SECRET", env.GITHUB_APP_CLIENT_SECRET);

	if (env.NODE_ENV == "production") {
		validateSupertokens(env);
	} else {
		if (env.VITE_SUPERTOKENS_IN_DEV) {
			validateSupertokens(env);
		}
	}

	// in depth validation
	if (
		env.VITE_GIT_REQUEST_PROXY_PATH.startsWith("/") === false ||
		env.VITE_GIT_REQUEST_PROXY_PATH.endsWith("/") === false
	) {
		throw Error(
			"VITE_GIT_REQUEST_PROXY_PATH must be a local path like that starts and ends with a slash `/` like `/git-proxy/`."
		);
	}
}
