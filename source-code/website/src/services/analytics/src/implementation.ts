import { clientSideEnv, isProduction } from "@env";
import { posthog } from "posthog-js";
import { isServer } from "solid-js/web";

// automatically initialize posthog when this file is imported
if (isProduction && isServer === false) {
  if (clientSideEnv.VITE_POSTHOG_TOKEN === undefined) {
    throw Error("Missing env variable VITE_POSTHOG_TOKEN");
  }
  if (posthog.has_opted_in_capturing()) {
    posthog.init(clientSideEnv.VITE_POSTHOG_TOKEN, {
      api_host: "https://eu.posthog.com",
    });
  }
}

/**
 * The analytics service.
 *
 * The `analytics` variable wraps posthog in case
 * the implementaiton should be changed in the future.
 */
export const analytics = new Proxy(posthog, {
  // wrapping the posthog function in a proxy to disable
  // posthog in development and on the server.
  get: (target, prop: keyof typeof posthog) => {
    if (
      posthog.has_opted_in_capturing() === false ||
      // only disable functions
      (typeof target[prop] !== "function" &&
        // deactivate in development
        (isProduction === false ||
          // deactivate on server
          isServer))
    ) {
      // return empty function that simpy does nothing
      return () => undefined;
    }
    return target[prop];
  },
});
