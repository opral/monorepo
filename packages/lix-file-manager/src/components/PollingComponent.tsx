import { useEffect } from "react";
import { useAtom } from "jotai";
import { withPollingAtom } from "@/state.ts";

const PollingComponent = () => {
  const [, setPolling] = useAtom(withPollingAtom);

  useEffect(() => {
    const interval = setInterval(() => {
      setPolling(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, [setPolling]);

  return null;
};

export default PollingComponent;