import type { DetectedChange, LixPlugin } from "@lix-js/sdk";
import { flatten } from "flat";
import { JSONPropertySchema } from "./schemas/JSONPropertySchema.js";

// @ts-expect-error - possibly too recursive inference
export const detectChanges: NonNullable<LixPlugin["detectChanges"]> = async ({
	before,
	after,
}) => {
	const detectedChanges: DetectedChange<typeof JSONPropertySchema>[] = [];

	const beforeParsed = before?.data
		? JSON.parse(new TextDecoder().decode(before?.data))
		: {};
	const afterParsed = after?.data
		? JSON.parse(new TextDecoder().decode(after?.data))
		: {};

	const flattenedBefore = flatten(beforeParsed, {
		safe: true,
	}) as Record<string, unknown>;
	const flattenedAfter = flatten(afterParsed, {
		safe: true,
	}) as Record<string, unknown>;

	for (const key in flattenedBefore) {
		if (!(key in flattenedAfter)) {
			detectedChanges.push({
				schema: JSONPropertySchema,
				entity_id: key,
				snapshot: undefined,
			});
		} else if (
			JSON.stringify(flattenedBefore[key]) !==
			JSON.stringify(flattenedAfter[key])
		) {
			detectedChanges.push({
				schema: JSONPropertySchema,
				entity_id: key,
				snapshot: {
					property: key,
					value: flattenedAfter[key],
				},
			});
		}
	}

	for (const key in flattenedAfter) {
		if (!(key in flattenedBefore)) {
			detectedChanges.push({
				schema: JSONPropertySchema,
				entity_id: key,
				snapshot: {
					property: key,
					value: flattenedAfter[key],
				},
			});
		}
	}

	return detectedChanges;
};
