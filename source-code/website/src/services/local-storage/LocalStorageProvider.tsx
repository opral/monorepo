import {
	createContext,
	JSXElement,
	onCleanup,
	onMount,
	useContext,
} from "solid-js";
import { createStore, reconcile, SetStoreFunction } from "solid-js/store";
import type { LocalStorageSchema } from "./schema.js";

const LocalStorageContext = createContext();

const LOCAL_STORAGE_KEY = "inlang-local-storage";

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
	const [store, setOriginStore] = createStore<LocalStorageSchema>({});

	/** custom setStore to trigger localStorage.setItem on change */
	const setStore: typeof setOriginStore = (...args: any) => {
		// @ts-ignore
		setOriginStore(...args);
		// write to local storage
		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
	};

	// read from local storage on mount
	onMount(() => {
		const json = localStorage.getItem(LOCAL_STORAGE_KEY);
		// we all love javascript. error prevention here if cache contains "undefined"
		if (json && json !== "undefined") {
			setStore(JSON.parse(json));
		}
		window.addEventListener("storage", onStorageSetByOtherWindow);
	});

	onCleanup(() => {
		window.removeEventListener("storage", onStorageSetByOtherWindow);
	});

	/** changed in another window should be reflected. thus listen for changes  */
	const onStorageSetByOtherWindow = (event: StorageEvent) => {
		if (event.key !== LOCAL_STORAGE_KEY) {
			return console.warn(
				`unknown localStorage key "${event.key}" was changed by another tab.`
			);
		}
		if (event.newValue === null) {
			return console.error(
				'localStorage key "store" was deleted by another tab. this should not happen.'
			);
		}
		// setting the origin store to not trigger a loop
		// using reconcile to ensure that the store is updated
		// even though json.parse and json.stringify are used.
		// read more here https://github.com/solidjs/solid/issues/1407#issuecomment-1344186955
		setOriginStore(reconcile(JSON.parse(event.newValue)));
	};

	return (
		<LocalStorageContext.Provider value={[store, setStore]}>
			{props.children}
		</LocalStorageContext.Provider>
	);
}
