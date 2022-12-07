import {
	createContext,
	createEffect,
	JSXElement,
	onMount,
	useContext,
} from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
import type { LocalStorageSchema } from "./schema.js";

const LocalStorageContext = createContext();

/**
 * Store that provides access to the local storage.
 */
export function useLocalStorage(): [
	get: LocalStorageSchema,
	set: SetStoreFunction<LocalStorageSchema>
] {
	return useContext(LocalStorageContext as any);
}

// use strg-f to find the usage of this provider
export function LocalStorageProvider(props: { children: JSXElement }) {
	const [store, setStore] = createStore<LocalStorageSchema>({});

	// read from local storage on mount
	onMount(() => {
		const json = localStorage.getItem("store");
		if (json) {
			setStore(JSON.parse(json));
		}
	});

	// write to local storage on change
	createEffect(() => {
		localStorage.setItem("store", JSON.stringify(store));
	});

	return (
		<LocalStorageContext.Provider value={[store, setStore]}>
			{props.children}
		</LocalStorageContext.Provider>
	);
}
