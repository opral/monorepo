export {
	LixFileDescriptorSchema,
	type LixFileDescriptor,
} from "./file/schema-definition.js";
export type { LixFile } from "./file/schema.js";

export {
	LixDirectoryDescriptorSchema,
	type LixDirectoryDescriptor,
} from "./directory/schema-definition.js";
export {
	normalizeFilePath,
	normalizeDirectoryPath,
	normalizePathSegment,
} from "./path.js";
