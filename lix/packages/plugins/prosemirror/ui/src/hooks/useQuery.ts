import { useState, useEffect } from "react";

/**
 * A simple hook to poll data with a specified interval
 * @param queryFn - Function that returns a promise with the data
 * @param interval - Polling interval in milliseconds
 * @param deps - Optional dependencies to trigger refetch (similar to useEffect deps)
 * @returns Object with data, isLoading, error, and refetch function
 */
export function useQuery<T>(
  queryFn: () => Promise<T>,
  interval: number = 250,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await queryFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and polling setup
  useEffect(() => {
    // Fetch immediately
    fetchData();

    // Set up polling interval
    const intervalId = setInterval(fetchData, interval);

    // Clean up on unmount or deps change
    return () => clearInterval(intervalId);
  }, [...deps, interval]); // Include interval in deps

  // Function to manually trigger refetch
  const refetch = () => {
    return fetchData();
  };

  return { data, isLoading, error, refetch };
}