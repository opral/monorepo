import { createEffect, createResource, createSignal } from "solid-js";

/**
 * The path within the repository.
 */
export const [path, setPath] = createSignal("/");
