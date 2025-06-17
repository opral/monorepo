/**
 * Returns the appropriate modifier key string for the current operating system.
 * For macOS, it returns "⌘" (Command).
 * For Windows/Linux and other OS, it returns "Ctrl".
 * @returns {string} The modifier key string ("⌘" or "Ctrl").
 */
export function getModKey(): string {
	if (typeof navigator !== "undefined") {
		const userAgent = window.navigator.userAgent.toLowerCase(),
			macosPlatforms = /(macintosh|macintel|macppc|mac68k|macos)/i,
			windowsPlatforms = /(win32|win64|windows|wince)/i,
			iosPlatforms = /(iphone|ipad|ipod)/i;
		let os = null;

		if (macosPlatforms.test(userAgent)) {
			os = "macos";
		} else if (iosPlatforms.test(userAgent)) {
			os = "ios";
		} else if (windowsPlatforms.test(userAgent)) {
			os = "windows";
		} else if (/android/.test(userAgent)) {
			os = "android";
		} else if (!os && /linux/.test(userAgent)) {
			os = "linux";
		}

		if (os === "macos" || os === "ios") {
			return "⌘"; // Command key for macOS and iOS
		}
	}
	return "Ctrl"; // Control key for Windows/Linux and others
}
