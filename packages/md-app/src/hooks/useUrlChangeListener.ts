import { useEffect } from "react";

/**
 * Hook that listens for URL parameter changes
 * With the new query-based system, URL parameters are automatically
 * polled by individual hooks, so this is primarily for popstate events
 */
export function useUrlChangeListener() {
  useEffect(() => {
    // Listen for popstate events (browser back/forward buttons)
    const handlePopState = () => {
      // With the new query system, URL changes will be picked up
      // automatically by the URL parameter hooks (100ms polling)
      // So we don't need to do anything special here
    };
    
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
}