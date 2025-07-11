import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { LixProvider } from "@lix-js/react-utils";
import { initializeLix } from "../helper/initializeLix";
import { nanoid, type Lix } from "@lix-js/sdk";
import { useSearchParams } from "react-router-dom";
import { upsertKeyValue } from "@/hooks/useKeyValue";
import { selectFiles } from "@/queries";

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
	const [lixId, setLixId] = useState<string | undefined>(undefined);
	const [lixError, setLixError] = useState<Error | null>(null);
	const [searchParams, setSearchParams] = useSearchParams();

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
		if (!lix || searchParams.get("lix") !== lixId) {
			const lixIdFromUrl = searchParams.get("lix");
			initializeLix(lixIdFromUrl)
				.then(({ lix, lixId }) => {
					setLix(lix);
					setLixId(lixId);
					if (lixId) {
						setSearchParams((currentParams) => {
							currentParams.set("lix", lixId);
							return currentParams
						});
					}
				})
				.catch(setLixError);
		}
	}, [lix, searchParams, lixId]);

	useEffect(() => {
		if (lix) {
			const urlLixId = searchParams.get("lix");
			// Only proceed if the current lix matches the URL parameter
			if (lixId && urlLixId === lixId) {
				const fileId = searchParams.get("f");
				if (fileId) {
					upsertKeyValue(lix, "flashtype_active_file", fileId)
				} else {
					selectFiles(lix).executeTakeFirst().then((file) => {
						if (!file) {
							const newFileId = nanoid()
							lix.db.insertInto("file").values({ id: newFileId, path: "/document.md", data: new TextEncoder().encode("") }).execute()
							setSearchParams((currentParams) => {
								currentParams.set("f", newFileId);
								return currentParams;
							});
						} else {
							setSearchParams((currentParams) => {
								currentParams.set("f", file.id);
								return currentParams;
							});
						}
					})
				}
			}
		}
	}, [lix, searchParams, lixId]);

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
