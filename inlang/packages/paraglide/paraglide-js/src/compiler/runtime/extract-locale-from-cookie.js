import { cookieName } from "./cookie-name.js";

export function extractLocaleFromCookie() {
	if (isServer) {
		throw new Error(
			"You tried calling `extractLocaleFromCookie()` on the server. The API uses `document` under the hood and is, therefore, not available on the server. Use `extractLocaleFromRequest()` in combination with `overwriteGetLocale()` on the server."
		);
	}
	const match = document.cookie.match(new RegExp(`(^| )${cookieName}=([^;]+)`));
	return match?.[2];
}
