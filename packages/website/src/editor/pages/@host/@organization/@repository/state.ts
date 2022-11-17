import { currentPageContext } from "@src/renderer/state.js";
import { createEffect, createResource, createSignal } from "solid-js";
import type { EditorRouteParams } from "./types.js";

/**
 * The path within the repository.
 */
export const [path, setPath] = createSignal("/");

export const routeParams = () =>
	currentPageContext().routeParams as EditorRouteParams;

export const currentBranch = () =>
	currentPageContext().urlParsed.search["branch"];

/**
 * tracking file system changes to trigger re-builds.
 *
 * setFsChange manually to date.now()
 */
export const [fsChange, setFsChange] = createSignal(Date.now());
