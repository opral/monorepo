/**
 * Helper script that validates the env file.
 *
 * Is called during the build prcess. That means
 * a wrong env file will lead to a canceled build.
 */

import dotenv from 'dotenv';

dotenv.config();

const errorMesssagePrefix = 'Env file misconfigured: ';

// if either is undefined, throw an error (both must be defined)
if (
	(process.env.VITE_PUBLIC_POSTHOG_TOKEN !== undefined &&
		process.env.VITE_PUBLIC_POSTHOG_API_HOST === undefined) ||
	(process.env.VITE_PUBLIC_POSTHOG_TOKEN === undefined &&
		process.env.VITE_PUBLIC_POSTHOG_API_HOST !== undefined)
) {
	throw Error(
		errorMesssagePrefix +
			'VITE_PUBLIC_POSTHOG_TOKEN and VITE_PUBLIC_POSTHOG_API_HOST must both be defined, or both undefined.'
	);
}
