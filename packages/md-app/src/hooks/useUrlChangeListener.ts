import { useEffect } from "react";
import { useAtom } from "jotai";
import { withPollingAtom } from "@/state";

/**
 * Hook that listens for URL parameter changes and triggers state refresh
 * This helps ensure that when the URL changes via history.replaceState,
 * the state atoms depending on URL parameters are re-evaluated
 */
export function useUrlChangeListener() {
  const [, setPolling] = useAtom(withPollingAtom);

  useEffect(() => {
    // Keep track of the current URL
    let currentUrl = window.location.href;

    // Function to check if URL changed
    const checkUrlChange = () => {
      if (currentUrl !== window.location.href) {
        // URL changed, update current URL and trigger polling
        currentUrl = window.location.href;
        setPolling(Date.now());
      }
    };

    // Set up interval to check for URL changes
    const intervalId = setInterval(checkUrlChange, 100);

    // Also listen for popstate events (browser back/forward buttons)
    const handlePopState = () => {
      setPolling(Date.now());
    };
    
    window.addEventListener('popstate', handlePopState);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setPolling]);
}