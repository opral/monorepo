/**
 * --------------------------------
 * Env file and variables related code.
 * --------------------------------
 */

/**
 * Environment variables that are avaibale ONLY server-side.
 *
 * _Example_
 * ```ts
 * 	const env = getServerSideEnv();
 * ```
 */
type ServerSideEnv = {
	GITHUB_PERSONAL_ACCESS_TOKEN?: string;
};

/**
 * Environment variables that are available client-side.
 *
 * Read [vite's documenation](https://vitejs.dev/guide/env-and-mode.html#env-variables-and-modes)
 * for more information.
 */
type ClientSideEnv = {
	/**
	 * The url of the proxy server for git requests.
	 */
	VITE_CORS_PROXY_URL: string;
};

/**
 * Get client-side env variables.
 *
 * _Example_
 * ```ts
 * 	 const env = clientSideEnv();
 * ```
 *
 * Use `getServerSideEnv` for server-side env variables.
 */
export function clientSideEnv(): ClientSideEnv {
	// the function provides type-safety
	return import.meta.env as unknown as ClientSideEnv;
}

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
export async function serverSideEnv(): Promise<ServerSideEnv & ClientSideEnv> {
	try {
		// dynamically importing dotenv to avoid clash with client side code
		const dotenv = await import("dotenv");
		dotenv.config();
		return process.env as ServerSideEnv & ClientSideEnv;
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
	if (env.GITHUB_PERSONAL_ACCESS_TOKEN === undefined) {
		console.warn(
			"Missing env variable GITHUB_PERSONAL_ACCESS_TOKEN. As long as no git repo is cloned, no error should occur."
		);
	} else if (env.VITE_CORS_PROXY_URL === undefined) {
		throw Error("Missing env variable VITE_CORS_PROXY_URL");
	}
}
