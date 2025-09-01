import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./index.css";
import { LixProvider } from "@lix-js/react-utils";
import { openLix, OpfsStorage } from "@lix-js/sdk";
import { initLixInspector } from "@lix-js/inspector";
import { KeyValueProvider } from "./key-value/use-key-value";
import { KEY_VALUE_DEFINITIONS } from "./key-value/schema";
import { plugin as mdPlugin } from "@lix-js/plugin-md-v2";

const router = createRouter({
	routeTree,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const lix = await openLix({
	providePlugins: [mdPlugin],
	storage: new OpfsStorage({ path: "flashtype.lix" }),
});

// Initialize Lix Inspector on load (hidden by default)
try {
	await initLixInspector({ lix, show: false });
} catch (e) {
	console.warn("Lix Inspector failed to initialize:", e);
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<LixProvider lix={lix}>
			<KeyValueProvider defs={KEY_VALUE_DEFINITIONS}>
				<RouterProvider router={router} />
			</KeyValueProvider>
		</LixProvider>
	</StrictMode>,
);
