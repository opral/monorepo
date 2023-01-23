/**
 * Types for the session logic which are shared by frontend and backend using supertokens for production and a simplified local version for simpler development.
 * @see <ADD_URL>
 * @see https://supertokens.com/docs/session/introduction
 * @author Leo Grützner
 */

export const enum LOCAL_SESSION_COOKIE_NAME {
	SESSION_ID = "inlang-dev-session-id",
	ACCESS_TOKEN_PAYLOAD = "inlang-dev-session-access-token-payload",
}
