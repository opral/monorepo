import { clientSideEnv, isProduction } from "@env";
import { posthog } from "posthog-js";
import { isServer } from "solid-js/web";

// automatically initialize posthog when this file is imported
if (isProduction && isServer === false) {
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
export const analytics = posthog;
