import { clientSideEnv, isProduction } from "@env";
import { posthog } from "posthog-js";
import { isServer } from "solid-js/web";

// automatically initialize posthog when this file is imported
if (
  isProduction &&
  isServer === false &&
  posthog.has_opted_out_capturing() === false
) {
  if (clientSideEnv.VITE_POSTHOG_TOKEN === undefined) {
    throw Error("Missing env variable VITE_POSTHOG_TOKEN");
  }
  posthog.init(clientSideEnv.VITE_POSTHOG_TOKEN, {
    api_host: "https://eu.posthog.com",
  });
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
    // return properties that are no function as is
    if (typeof target[prop] !== "function") {
      return target[prop];
    }
    // deactivate in development and on the server
    // be returning a mock function that does nothing
    else if (isProduction === false || isServer) {
      return () => undefined;
    }
    // wrap the called function in a try catch block to
    // prevent errors from propagating through the app
    return (...args: any) => {
      try {
        target[prop](...args);
      } catch (error) {
        // in the future -> log to sentry
        console.error(error);
      }
    };
  },
});
