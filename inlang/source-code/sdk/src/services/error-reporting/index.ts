import { init, setUser, captureException } from "@sentry/browser";
import { ENV_VARIABLES } from "../env-variables/index.js";

export function initErrorReporting(args: { projectId: string }) {
	if (ENV_VARIABLES.PUBLIC_INLANG_SDK_SENTRY_DSN) {
		// in order to receive alerts like "if more than 100 "users" are effected, notify the team"
		// the user id is set to the project id
		setUser({ id: args.projectId });
		init({
			dsn: ENV_VARIABLES.PUBLIC_INLANG_SDK_SENTRY_DSN,
			release: ENV_VARIABLES.SDK_VERSION,
		});
	}
}

/**
 * Capture an error.
 *
 * @example
 *   try {
 *     throw new Error("Something went wrong");
 *   } catch (error) {
 *     captureError(error);
 *   }
 */
export function captureError(error: Error | any) {
	return captureException(error);
}
