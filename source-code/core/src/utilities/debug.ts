import { inspect } from "./polyfills/util.js";

export const debug = (element: unknown) =>
  console.debug(inspect(element, { depth: 99 }));
