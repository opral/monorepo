import type { DetectedChange, LixPlugin } from "@lix-js/sdk";

export const detectChanges: NonNullable<LixPlugin["detectChanges"]> = async ({
	before,
	after,
}) => {
	const documentBefore: any = before
		? JSON.parse(new TextDecoder().decode(before?.data))
		: undefined;
	const documentAfter: any = after
		? JSON.parse(new TextDecoder().decode(after?.data))
		: undefined;

	const detectedChanges: DetectedChange[] = [];

	// iterate over document content to detect changes
	// for (const ...)

	return detectedChanges;
};
