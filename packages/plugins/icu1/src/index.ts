import { plugin } from "./plugin.js";
export default plugin;
// The ICU MessageFormat 1 <-> inlang conversion, for plugins of formats that
// store ICU messages, e.g. next-intl.
export { parseMessage, type ParsedMessage } from "./parse.js";
export { serializeMessage } from "./serialize.js";
export { escapeIcuText } from "./escape.js";
