import { useEffect, useState, useCallback } from "react";
import { selectLix } from "../queries";
import type { Lix } from "@lix-js/sdk";

/**
 * Custom hook for reactive database queries that automatically update when data changes
 * Based on the prosemirror example implementation
 */
export function useQuery<T>(queryFn: (lix: Lix) => Promise<T>) {
	const [data, setData] = useState<T | undefined>(undefined);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | undefined>(undefined);

	const memoizedQueryFn = useCallback(queryFn, [queryFn]);

	useEffect(() => {
		let subscription: { unsubscribe: () => void } | undefined;

		const setupSubscription = async () => {
			try {
				setLoading(true);
				setError(undefined);
				
				const lix = await selectLix();
				
				// For now, just run the query once since the observe API needs query builders
				// TODO: Implement proper reactive subscriptions when the API is ready
				const result = await memoizedQueryFn(lix);
				setData(result);
				setLoading(false);

			} catch (err) {
				setError(err instanceof Error ? err : new Error(String(err)));
				setLoading(false);
			}
		};

		setupSubscription();

		// Cleanup subscription on unmount
		return () => {
			if (subscription) {
				subscription.unsubscribe();
			}
		};
	}, [memoizedQueryFn]);

	return { data, loading, error };
}

/**
 * Suspense-compatible reactive query hook
 */
export function useSuspenseQuery<T>(queryFn: (lix: Lix) => Promise<T>): T {
	const [data, setData] = useState<T | undefined>(undefined);
	const [promise, setPromise] = useState<Promise<T> | undefined>(undefined);

	const memoizedQueryFn = useCallback(queryFn, [queryFn]);

	useEffect(() => {
		if (!data && !promise) {
			const newPromise = (async () => {
				const lix = await selectLix();
				const result = await memoizedQueryFn(lix);
				setData(result);
				return result;
			})();
			setPromise(newPromise);
		}
	}, [memoizedQueryFn, data, promise]);

	if (promise) {
		throw promise;
	}

	if (data === undefined) {
		throw new Promise((resolve) => {
			setTimeout(resolve, 0);
		});
	}

	return data;
}

/**
 * Reactive query hook that returns the first result
 */
export function useQueryTakeFirst<T>(queryFn: (lix: Lix) => Promise<T | undefined>) {
	return useQuery(queryFn);
}

/**
 * Key-value store hook for shared reactive state
 * Based on the prosemirror example's useKeyValue implementation
 */
export function useKeyValue<T>(key: string) {
	const [value, setValue] = useState<T | undefined>(undefined);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadValue = async () => {
			try {
				setLoading(true);
				const lix = await selectLix();
				
				// Load initial value
				const result = await lix.db
					.selectFrom("key_value")
					.where("key", "=", key)
					.select("value")
					.executeTakeFirst();
				
				setValue(result?.value ? JSON.parse(result.value) : undefined);
				setLoading(false);

			} catch (err) {
				console.error(`Error in useKeyValue for key ${key}:`, err);
				setLoading(false);
			}
		};

		loadValue();
	}, [key]);

	const updateValue = async (newValue: T) => {
		try {
			const lix = await selectLix();
			await lix.db
				.insertInto("key_value")
				.values({ key, value: JSON.stringify(newValue) })
				.onConflict((oc) => oc.doUpdateSet({ value: JSON.stringify(newValue) }))
				.execute();
			setValue(newValue);
		} catch (err) {
			console.error(`Error updating key-value ${key}:`, err);
		}
	};

	return { value, setValue: updateValue, loading };
}