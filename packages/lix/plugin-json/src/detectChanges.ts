import type { DetectedChange, LixPlugin } from "@lix-js/sdk";
import { JSONPropertySchema } from "./schemas/json-pointer-value.js";
import {
	pointerFromSegments,
	type JSONValue,
} from "./utilities/jsonPointer.js";

const isObject = (value: unknown): value is Record<string, JSONValue> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const isContainer = (
	value: JSONValue | undefined,
): value is JSONValue[] | Record<string, JSONValue> =>
	Array.isArray(value) || isObject(value);

const areValuesEqual = (left: JSONValue, right: JSONValue): boolean =>
	Object.is(left, right);

const pushDeletion = (changes: DetectedChange[], pointer: string) => {
	changes.push({
		schema: JSONPropertySchema,
		entity_id: pointer,
		snapshot_content: null,
	});
};

const pushUpsert = (
	changes: DetectedChange[],
	pointer: string,
	value: JSONValue,
) => {
	changes.push({
		schema: JSONPropertySchema,
		entity_id: pointer,
		snapshot_content: {
			property: pointer,
			value,
		},
	});
};

const collectLeaves = (
	value: JSONValue | undefined,
	path: string[],
	visit: (pointer: string, nodeValue: JSONValue) => void,
): void => {
	if (value === undefined) {
		return;
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			visit(pointerFromSegments(path), []);
			return;
		}

		for (let index = 0; index < value.length; index++) {
			path.push(index.toString());
			collectLeaves(value[index], path, visit);
			path.pop();
		}

		return;
	}

	if (isObject(value)) {
		const keys = Object.keys(value);
		if (keys.length === 0) {
			visit(pointerFromSegments(path), {});
			return;
		}

		for (const key of keys) {
			path.push(key);
			collectLeaves(value[key], path, visit);
			path.pop();
		}

		return;
	}

	visit(pointerFromSegments(path), value);
};

const diffJson = (
	beforeValue: JSONValue | undefined,
	afterValue: JSONValue | undefined,
	path: string[],
	changes: DetectedChange[],
) => {
	if (beforeValue === undefined && afterValue === undefined) {
		return;
	}

	if (afterValue === undefined) {
		collectLeaves(beforeValue, path, (pointer, _value) => {
			pushDeletion(changes, pointer);
		});
		return;
	}

	if (beforeValue === undefined) {
		collectLeaves(afterValue, path, (pointer, value) => {
			pushUpsert(changes, pointer, value);
		});
		return;
	}

	const beforeIsContainer = isContainer(beforeValue);
	const afterIsContainer = isContainer(afterValue);

	if (beforeIsContainer && afterIsContainer) {
		if (Array.isArray(beforeValue) && Array.isArray(afterValue)) {
			const max = Math.max(beforeValue.length, afterValue.length);
			for (let index = 0; index < max; index++) {
				path.push(index.toString());
				diffJson(beforeValue[index], afterValue[index], path, changes);
				path.pop();
			}
			return;
		}

		if (isObject(beforeValue) && isObject(afterValue)) {
			const keys = new Set([
				...Object.keys(beforeValue),
				...Object.keys(afterValue),
			]);

			for (const key of keys) {
				path.push(key);
				diffJson(beforeValue[key], afterValue[key], path, changes);
				path.pop();
			}
			return;
		}
	}

	if (beforeIsContainer || afterIsContainer) {
		collectLeaves(beforeValue, path, (pointer, _value) => {
			pushDeletion(changes, pointer);
		});
		collectLeaves(afterValue, path, (pointer, value) => {
			pushUpsert(changes, pointer, value);
		});
		return;
	}

	if (!areValuesEqual(beforeValue, afterValue)) {
		const pointer = pointerFromSegments(path);
		pushUpsert(changes, pointer, afterValue);
	}
};

/**
 * Detects JSON Pointer addressed changes between two JSON documents.
 *
 * @example
 * ```ts
 * const changes = detectChanges({ before, after });
 * // => [{ entity_id: "/fields/0/name", ... }]
 * ```
 */
export const detectChanges: NonNullable<LixPlugin["detectChanges"]> = ({
	before,
	after,
}) => {
	const decoder = new TextDecoder();

	const beforeParsed = before?.data
		? (JSON.parse(decoder.decode(before.data)) as JSONValue)
		: undefined;
	const afterParsed = after?.data
		? (JSON.parse(decoder.decode(after.data)) as JSONValue)
		: undefined;

	const detectedChanges: DetectedChange[] = [];
	diffJson(beforeParsed, afterParsed, [], detectedChanges);
	return detectedChanges;
};
