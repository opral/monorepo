import { createFileRoute } from "@tanstack/react-router";

/**
 * Minimal placeholder for the root path while the V2 layout owns rendering.
 *
 * @example
 * <Route />
 */
export const Route = createFileRoute("/")({
	component: RootIndex,
});

function RootIndex() {
	return null;
}
