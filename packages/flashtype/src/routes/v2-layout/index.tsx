import { createFileRoute } from "@tanstack/react-router";
import { V2LayoutShell } from "../../prototypes/v2-layout/layout-shell";

/**
 * Registers the Fleet-inspired prototype route at `/v2-layout`.
 *
 * @example
 * <Route />
 */
export const Route = createFileRoute("/v2-layout/")({
	component: V2LayoutShell,
});
