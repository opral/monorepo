import { useEffect, useState } from "react";

/**
 * Hook that detects whether the clipboard has text content.
 * Polls every 2 seconds and checks on window focus.
 *
 * @returns `true` if clipboard has non-empty text content, `false` otherwise
 */
export function useClipboardContent(): boolean {
	const [hasContent, setHasContent] = useState(false);

	useEffect(() => {
		let mounted = true;

		const checkClipboard = async () => {
			if (typeof navigator === "undefined" || !navigator.clipboard?.readText) {
				return;
			}

			try {
				const text = await navigator.clipboard.readText();
				if (mounted) {
					setHasContent(text.trim().length > 0);
				}
			} catch {
				// Permission denied or not supported
				if (mounted) {
					setHasContent(false);
				}
			}
		};

		// Check on mount
		checkClipboard();

		// Check when window gains focus
		window.addEventListener("focus", checkClipboard);

		// Poll every 2 seconds
		const interval = setInterval(checkClipboard, 2000);

		return () => {
			mounted = false;
			window.removeEventListener("focus", checkClipboard);
			clearInterval(interval);
		};
	}, []);

	return hasContent;
}
