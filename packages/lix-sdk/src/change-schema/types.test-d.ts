/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
	ExperimentalChangeSchema,
	ExperimentalInferType,
} from "./types.js";
import { test, assertType } from "vitest";

test("a json change schema should be infer the properties", () => {
	const jsonChangeSchema = {
		key: "mock",
		type: "json",
		schema: {
			type: "object",
			properties: {
				name: { type: "string" },
				age: { type: "number" },
				location: { type: "object" },
			},
			required: ["name", "age", "location"],
		},
	} as const satisfies ExperimentalChangeSchema;

	const snapshot: ExperimentalInferType<typeof jsonChangeSchema> = {
		name: "John",
		age: 5,
		location: {
			city: "New York",
			country: "USA",
		},
	};

	assertType<{
		[x: string]: unknown;
		name: string;
		age: number;
		location: {
			[x: string]: unknown;
		};
	}>(snapshot);
});

test("a blob change schema should be infer the properties", () => {
	const blobChangeSchema = {
		key: "mock",
		type: "blob",
	} as const satisfies ExperimentalChangeSchema;

	const snapshot: ExperimentalInferType<typeof blobChangeSchema> =
		new ArrayBuffer(0);

	assertType<ArrayBuffer>(snapshot);
});
