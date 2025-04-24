import { useEffect, useRef, useState, DependencyList } from "react";
import { useLix } from "./use-lix.ts";
import type { Lix } from "@lix-js/sdk";

/**
 * Polls a query function and updates the state with the result.
 *
 * @param queryFn - The function to poll
 * @param deps - Optional dependencies that will trigger a re-fetch when changed
 * @param interval - The interval in milliseconds
 * @returns A tuple of [data, loading, error, fetch]
 */
export function useQuery<T>(
  queryFn: (lix: Lix) => Promise<T>,
  deps: DependencyList = [],
  interval = 250
): [T | null, boolean, Error | null, () => void] {
  const lix = useLix();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const dataRef = useRef<string | null>(null); // serialized data
  const mountedRef = useRef(true);

  const fetch = async () => {
    if (!mountedRef.current) return;
    setLoading(true);

    try {
      const result = await queryFn(lix);
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
  }, [interval, ...(Array.isArray(deps) ? deps : [])]);

  return [data, loading, error, fetch];
}
