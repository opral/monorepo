import { useEffect } from "react";
import { posthog } from "posthog-js";
export function App({ children }: { children: React.ReactNode }) {

	useEffect(() => {
		if (import.meta.env.PUBLIC_LIX_POSTHOG_TOKEN) {
			posthog.init(import.meta.env.PUBLIC_LIX_POSTHOG_TOKEN, {
				api_host: "https://eu.i.posthog.com",
				capture_performance: false,
				autocapture: {
					capture_copied_text: true,
				},
			});
			posthog.capture("$pageview");
		} else {
			console.info("No posthog token found");
		}
		return () => posthog.reset();
	}, []);

	return (
		<main className="w-full h-screen overflow-hidden bg-white flex flex-col">
			{children}
		</main>
	);
}
