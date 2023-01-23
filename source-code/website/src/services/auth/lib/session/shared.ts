/**
 * Session logic which is shared by frontend and backend using supertokens for production and a simplified local version for simpler development.
 * Opt in to supertokens in development by setting the env variable 'VITE_SUPERTOKENS_IN_DEV' to 'true'.
 * Also check to set the other required env vars, which are listed in the development setup guid.
 * @see <ADD_URL>
 * @see https://supertokens.com/docs/session/introduction
 * @author Leo Grützner
 */

import type { LOCAL_SESSION_COOKIE_NAME } from "./types.js";
import cookie from "cookie";

export const getLocalSessionCookie = (
  cookieString: string,
  type: LOCAL_SESSION_COOKIE_NAME
) => {
  const cookies = cookie.parse(cookieString || "");

  try {
    return JSON.parse(cookies[type] ?? "null");
  } catch (e) {
    console.error("Error parsing session cookie of type", type, e);
    return undefined;
  }
};
