import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { LixProvider } from "@lix-js/react-utils";
import { initializeLix } from "../helper/initializeLix";
import { nanoid, type Lix } from "@lix-js/sdk";
import { useSearchParams } from "react-router-dom";
import { upsertKeyValue } from "@/hooks/useKeyValue";
import { selectFiles } from "@/queries";
import { Suspense } from "react";

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
	const [searchParams] = useSearchParams();


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

	useEffect(() => {
		if (lix) {
			const fileId = searchParams.get("f");
			if (fileId) {
				upsertKeyValue(lix, "flashtype_active_file", fileId)
			} else {
				selectFiles(lix).executeTakeFirst().then((file) => {
					if (!file) {
						const newFileId = nanoid()
						lix.db.insertInto("file").values({ id: newFileId, path: "/document.md", data: new TextEncoder().encode("") }).execute()
						searchParams.set("f", newFileId)
					} else {
						searchParams.set("f", file.id)
					}
				})
			}
		}
	}, [lix, searchParams]);

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
			<Suspense fallback={<LoadingScreen />}>
				<main className="w-full h-screen overflow-hidden bg-white flex flex-col">
					{children}
				</main>
			</Suspense>
		</LixProvider>
	);
}
