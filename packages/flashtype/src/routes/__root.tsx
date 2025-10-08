import { createRootRoute } from "@tanstack/react-router";
import { V2LayoutShell } from "../prototypes/v2-layout/layout-shell";

export const Route = createRootRoute({
	component: Root,
	notFoundComponent: () => (
		<main style={{ maxWidth: 720, margin: "48px auto", padding: "0 16px" }}>
			<h1 style={{ fontSize: 28, marginBottom: 8 }}>404 — Not Found</h1>
			<p style={{ color: "#555" }}>
				The page you’re looking for does not exist.
			</p>
		</main>
	),
});

function Root() {
	return <V2LayoutShell />;
}
