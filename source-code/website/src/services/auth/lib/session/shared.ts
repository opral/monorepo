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
