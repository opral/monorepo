import { parseJsonPointer, formatJsonPointer } from "@jsonjoy.com/json-pointer";

type JSONPrimitive = string | number | boolean | null;
export type JSONValue =
	| JSONPrimitive
	| JSONValue[]
	| {
			[key: string]: JSONValue;
	  };

const isObject = (value: unknown): value is Record<string, JSONValue> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const isContainer = (
	value: unknown,
): value is Record<string, JSONValue> | JSONValue[] =>
	Array.isArray(value) || isObject(value);

const isIndexToken = (token: string): boolean =>
	token === "-" || /^[0-9]+$/.test(token);

const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

const assertSafeKey = (token: string) => {
	if (UNSAFE_KEYS.has(token)) {
		throw new Error(`Unsafe JSON pointer segment "${token}" is not permitted.`);
	}
};

const createContainerForToken = (
	token: string,
): JSONValue[] | Record<string, JSONValue> => (isIndexToken(token) ? [] : {});

const normaliseIndex = (
	token: string,
	length: number,
	options: { allowAppend: boolean },
): number => {
	if (token === "-") {
		if (!options.allowAppend) {
			throw new Error("Cannot append using '-' in this context.");
		}
		return length;
	}

	const index = Number.parseInt(token, 10);
	if (Number.isNaN(index) || index < 0) {
		throw new Error(`Invalid array index in JSON pointer token "${token}".`);
	}
	return index;
};

const getPointerPath = (pointer: string): string[] =>
	parseJsonPointer(pointer).map((segment) => segment.toString());

/**
 * Serialises an array of pointer segments to an RFC&nbsp;6901 compliant string.
 *
 * @example
 * ```ts
 * pointerFromSegments(["settings", "locales", "0"]);
 * // => "/settings/locales/0"
 * ```
 */
export const pointerFromSegments = (segments: string[]): string =>
	formatJsonPointer(segments);

/**
 * Sets the value at the provided JSON Pointer, creating any missing containers on
 * the way and returning the updated document root.
 *
 * @example
 * ```ts
 * const doc = setValueAtPointer({}, "/team/0/name", "Ada");
 * // doc === { team: [{ name: "Ada" }] }
 * ```
 */
export const setValueAtPointer = (
	document: JSONValue | undefined,
	pointer: string,
	value: JSONValue,
): JSONValue => {
	const path = getPointerPath(pointer);

	if (path.length === 0) {
		return value;
	}

	if (!isContainer(document)) {
		document = createContainerForToken(path[0]!);
	}

	let current: Record<string, JSONValue> | JSONValue[] = document as
		| Record<string, JSONValue>
		| JSONValue[];

	for (let i = 0; i < path.length - 1; i++) {
		const token = path[i]!;
		const nextToken = path[i + 1]!;

		if (Array.isArray(current)) {
			const index = normaliseIndex(token, current.length, {
				allowAppend: true,
			});
			const child = current[index];

			if (!isContainer(child)) {
				current[index] = createContainerForToken(nextToken);
			}

			current = current[index] as typeof current;
			continue;
		}

		assertSafeKey(token);

		if (!isContainer(current[token])) {
			current[token] = createContainerForToken(nextToken);
		}

		current = current[token] as typeof current;
	}

	const lastToken = path[path.length - 1]!;

	if (Array.isArray(current)) {
		const index = normaliseIndex(lastToken, current.length, {
			allowAppend: true,
		});

		if (index === current.length) {
			current.push(value);
		} else {
			current[index] = value;
		}

		return document;
	}

	assertSafeKey(lastToken);
	current[lastToken] = value;
	return document;
};

/**
 * Removes the value located at the provided JSON Pointer. Creates no additional
 * structures and returns the updated document root (or `undefined` if the root
 * itself was removed).
 *
 * @example
 * ```ts
 * const afterRemoval = removeValueAtPointer({ users: ["a", "b"] }, "/users/0");
 * // afterRemoval === { users: ["b"] }
 * ```
 */
export const removeValueAtPointer = (
	document: JSONValue | undefined,
	pointer: string,
): JSONValue | undefined => {
	const path = getPointerPath(pointer);

	if (path.length === 0) {
		return undefined;
	}

	if (!isContainer(document)) {
		return document;
	}

	let current: JSONValue | undefined = document;

	for (let i = 0; i < path.length - 1; i++) {
		const token = path[i]!;

		if (Array.isArray(current)) {
			const index = normaliseIndex(token, current.length, {
				allowAppend: false,
			});
			current = current[index];
		} else if (isObject(current)) {
			assertSafeKey(token);
			current = current[token];
		} else {
			return document;
		}

		if (!isContainer(current)) {
			return document;
		}
	}

	const lastToken = path[path.length - 1]!;

	if (Array.isArray(current)) {
		const index = normaliseIndex(lastToken, current.length, {
			allowAppend: false,
		});

		if (index < current.length) {
			current.splice(index, 1);
		}

		return document;
	}

	assertSafeKey(lastToken);
	delete current[lastToken];
	return document;
};
