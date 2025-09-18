export { LixFileDescriptorSchema } from "./file/schema.js";
export type { LixFileDescriptor, LixFile } from "./file/schema.js";

export { LixDirectoryDescriptorSchema } from "./directory/schema.js";
export type { LixDirectoryDescriptor } from "./directory/schema.js";
export {
	normalizeFilePath,
	normalizeDirectoryPath,
	normalizePathSegment,
} from "./path.js";
