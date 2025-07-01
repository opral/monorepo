import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { LixProvider } from "@lix-js/react-utils";
import { initializeLix } from "../helper/initializeLix";
import type { Lix } from "@lix-js/sdk";

function LoadingScreen() {
	return (
		<div className="w-full h-screen flex items-center justify-center bg-white">
			<div className="text-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
				<p className="text-gray-600">Loading Lix...</p>
			</div>
		</div>
	);
}

export function App({ children }: { children: React.ReactNode }) {
	const [lix, setLix] = useState<Lix | null>(null);
	const [lixError, setLixError] = useState<Error | null>(null);

	useEffect(() => {
		if (import.meta.env.PUBLIC_LIX_POSTHOG_TOKEN) {
			posthog.init(import.meta.env.PUBLIC_LIX_POSTHOG_TOKEN, {
				api_host: "https://eu.i.posthog.com",
				capture_performance: false,
				autocapture: {
					capture_copied_text: true,
				},
				persistence: 'localStorage',
				loaded: (posthog) => {
					posthog.capture("$pageview");
				}
			});
		} else {
			console.info("No posthog token found");
		}
		return () => posthog.reset();
	}, []);

	useEffect(() => {
		initializeLix()
			.then(setLix)
			.catch(setLixError);
	}, []);

	if (lixError) {
		return (
			<main className="w-full h-screen overflow-hidden bg-white flex flex-col items-center justify-center">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-red-600 mb-2">Failed to initialize Lix</h2>
					<p className="text-gray-600 mb-4">{lixError.message}</p>
					<button
						onClick={() => window.location.reload()}
						className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
					>
						Retry
					</button>
				</div>
			</main>
		);
	}

	if (!lix) {
		return <LoadingScreen />;
	}

	return (
		<LixProvider lix={lix}>
			<main className="w-full h-screen overflow-hidden bg-white flex flex-col">
				{children}
			</main>
		</LixProvider>
	);
}
