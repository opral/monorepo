import { PostHog } from "posthog-node";
import type { TelemetryEvents } from "./events.js";

const posthogToken = PARJS_POSTHOG_TOKEN;

const posthog = new PostHog(posthogToken, {
  host: "https://eu.posthog.com",
  // Events are not captured if not immediately flushed.
  //
  // Posthog shouldn't batch events because CLI commands
  // are short-lived, see https://posthog.com/docs/libraries/node.
  flushAt: 1,
  flushInterval: 0,
  requestTimeout: 1000,
});

/**
 * Telmetry for the CLI.
 *
 * Auto injects the git origin url.
 */
export const telemetry = new Proxy(posthog, {
  get(target, prop: keyof PostHog) {
    if (prop === "capture") return capture;
    return target[prop];
  },
}) as unknown as Omit<PostHog, "capture"> & { capture: typeof capture };

/**
 * Wrapper to auto inject the git origin url and user id.
 */
function capture(args: CaptureEventArguments, projectId?: string) {
  if (!posthogToken) return; //if there is no posthog token defined, that's ok

  const data: Parameters<PostHog["capture"]>[0] = {
    ...args,
    distinctId: "unknown",
    groups: projectId ? { project: projectId } : {},
  };

  return posthog.capture(data);
}

/**
 * Typesafe wrapper around the `telemetryNode.capture` method.
 *
 * Exists to avoid typos/always set the correct event name and properties.
 */
type CaptureEventArguments = Omit<
  Parameters<PostHog["capture"]>[0],
  "distinctId" | "groups"
> & {
  event: TelemetryEvents;
};
