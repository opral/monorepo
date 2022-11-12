import { currentPageContext } from "@src/renderer/state.js";
import { createEffect, createResource, createSignal } from "solid-js";
import type { EditorRouteParams } from "./types.js";

/**
 * The path within the repository.
 */
export const [path, setPath] = createSignal("/");

export const routeParams = () =>
	currentPageContext.routeParams as EditorRouteParams;
