import { inspect } from "util";

export const debug = (element: unknown) =>
  console.debug(inspect(element, false, 999));

// ----------------------------------------------------------------------------

export const unhandled = (type: never, context?: unknown): never => {
  throw new Error(
    `unhandled case: '${type}'${context ? ` for ${inspect(context)}` : ""}`
  );
};
