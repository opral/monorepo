import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./index.css";
import { LixProvider } from "@lix-js/react-utils";
import { openLix, OpfsSahEnvironment, type Lix } from "@lix-js/sdk";
import { initLixInspector } from "@lix-js/inspector";
import { KeyValueProvider } from "./key-value/use-key-value";
import { KEY_VALUE_DEFINITIONS } from "./key-value/schema";
import mdPlugin from "@lix-js/plugin-md?raw";
import { ErrorFallback } from "./main.error";

const router = createRouter({
	routeTree,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Error UI moved to ./main.error.tsx

function AppRoot() {
	const [lix, setLix] = useState<Lix | null>(null);
	const [error, setError] = useState<unknown>(null);

	useEffect(() => {
		let cancelled = false;
		const env = new OpfsSahEnvironment({ key: "flashtype" });
		let current: Lix | undefined;
		(async () => {
			try {
				const instance = await openLix({
					pluginsRaw: [mdPlugin],
					environment: env,
				});
				if (cancelled) {
					await instance.close();
					return;
				}
				current = instance;
				await initLixInspector({ lix: instance, show: false });
				if (!cancelled) setLix(instance);
			} catch (e) {
				if (!cancelled) setError(e);
				try {
					await env.close();
				} catch {
					// ignore cleanup errors
				}
			}
		})();
		return () => {
			cancelled = true;
			setLix(null);
			void (async () => {
				try {
					if (current) await current.close();
				} finally {
					try {
						await env.close();
					} catch {
						// ignore teardown errors
					}
				}
			})();
		};
	}, []);

	if (error) return <ErrorFallback error={error} />;
	if (!lix)
		return (
			<div className="min-h-dvh w-full flex items-center justify-center p-6 text-sm text-muted-foreground">
				Loading…
			</div>
		);

	return (
		<LixProvider lix={lix}>
			<KeyValueProvider defs={KEY_VALUE_DEFINITIONS}>
				<RouterProvider router={router} />
			</KeyValueProvider>
		</LixProvider>
	);
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<AppRoot />
	</StrictMode>,
);
