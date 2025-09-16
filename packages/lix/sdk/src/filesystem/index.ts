/**
 * Filesystem entry point aggregating file and directory utilities.
 *
 * @example
 * import { LixFileDescriptorSchema, LixDirectoryDescriptorSchema } from "@lix-js/sdk/filesystem";
 */
export { LixFileDescriptorSchema } from "./file/schema.js";
export type { LixFileDescriptor, LixFile } from "./file/schema.js";

export { LixDirectoryDescriptorSchema } from "./directory/schema.js";
export type { LixDirectoryDescriptor } from "./directory/schema.js";
