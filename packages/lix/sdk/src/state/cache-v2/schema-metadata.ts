export type CacheSchemaPropertyValueKind =
	| "string"
	| "number"
	| "integer"
	| "boolean"
	| "json";

export interface CacheSchemaPropertyMetadata {
	propertyName: string;
	columnName: string;
	valueKind: CacheSchemaPropertyValueKind;
}

const schemaPropertyMetadata = new Map<string, CacheSchemaPropertyMetadata[]>();

function metadataKey(schemaKey: string, schemaVersion: string): string {
	return `${schemaKey}::${schemaVersion}`;
}

export function registerStateCacheSchemaProperties(args: {
	schemaKey: string;
	schemaVersion: string;
	properties: CacheSchemaPropertyMetadata[];
}): void {
	const key = metadataKey(args.schemaKey, args.schemaVersion);
	// Store a copy to avoid accidental external mutation
	schemaPropertyMetadata.set(key, [...args.properties]);
}

export function getStateCacheSchemaProperties(args: {
	schemaKey: string;
	schemaVersion: string;
}): CacheSchemaPropertyMetadata[] | undefined {
	const key = metadataKey(args.schemaKey, args.schemaVersion);
	const properties = schemaPropertyMetadata.get(key);
	return properties ? [...properties] : undefined;
}

export function clearStateCacheSchemaProperties(args: {
	schemaKey: string;
	schemaVersion: string;
}): void {
	schemaPropertyMetadata.delete(metadataKey(args.schemaKey, args.schemaVersion));
}
