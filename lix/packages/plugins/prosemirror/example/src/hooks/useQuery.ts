import { useEffect, useRef, useState } from "react";

/**
 * Polls a query function and updates the state with the result.
 *
 * @param queryFn - The function to poll
 * @param interval - The interval in milliseconds
 * @returns A tuple of [data, loading, error, fetch]
 */
export function useQuery<T>(
	queryFn: () => Promise<T>,
	interval = 250,
): [T | null, boolean, Error | null, () => void] {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const dataRef = useRef<string | null>(null); // serialized data
	const mountedRef = useRef(true);

	const fetch = async () => {
		try {
			const result = await queryFn();
			const serialized = JSON.stringify(result);
			if (!mountedRef.current) return;

			if (serialized !== dataRef.current) {
				dataRef.current = serialized;
				setData(result);
			}
			setError(null);
		} catch (err) {
			if (!mountedRef.current) return;
			console.error(err);
			setError(err instanceof Error ? err : new Error(String(err)));
		} finally {
			if (mountedRef.current) setLoading(false);
		}
	};

	useEffect(() => {
		mountedRef.current = true;
		fetch();
		const id = setInterval(fetch, interval);
		return () => {
			mountedRef.current = false;
			clearInterval(id);
		};
	}, [interval]);

	return [data, loading, error, fetch];
}
