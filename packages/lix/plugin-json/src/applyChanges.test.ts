import { expect, test } from "vitest";
import { applyChanges } from "./applyChanges.js";
import { mockChanges } from "./utilities/mockChanges.js";
import type { LixPlugin } from "@lix-js/sdk";

type ApplyChangesArgs = Parameters<NonNullable<LixPlugin["applyChanges"]>>[0];
type ApplyChangesFile = ApplyChangesArgs["file"] & {
	lixcol_metadata?: ApplyChangesArgs["file"]["metadata"];
};

const createMockFile = ({
	data,
	path = "/mock.json",
}: {
	data?: Uint8Array;
	path?: string;
} = {}): ApplyChangesFile =>
	({
		id: "mock",
		directory_id: null,
		name: path.split("/").pop() ?? "mock",
		extension: path.includes(".") ? (path.split(".").pop() ?? "") : null,
		path,
		data,
		metadata: {},
		lixcol_metadata: {},
		hidden: false,
		lixcol_inherited_from_version_id: null,
		lixcol_created_at: new Date().toISOString(),
		lixcol_updated_at: new Date().toISOString(),
	}) as ApplyChangesFile;

test("it applies an insert change", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			Name: "Anna",
			Age: 20,
		}),
	);
	const after = new TextEncoder().encode(
		JSON.stringify({
			Name: "Anna",
			Age: 20,
			City: "Berlin",
		}),
	);

	const changes = mockChanges({
		file: createMockFile({}),
		fileUpdates: [before, after],
	});

	const { fileData: applied } = applyChanges({
		file: createMockFile({ data: before }),
		changes,
	} as ApplyChangesArgs);

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(after),
	);
});

test("it applies an update change", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			Name: "Samuel",
			City: "Berlin",
		}),
	);
	const after = new TextEncoder().encode(
		JSON.stringify({
			Name: "Samuel",
			Age: "New York",
		}),
	);

	const changes = mockChanges({
		file: createMockFile({}),
		fileUpdates: [before, after],
	});

	const { fileData: applied } = applyChanges({
		file: createMockFile({ data: before }),
		changes,
	} as ApplyChangesArgs);

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(after),
	);
});

test("it applies a delete change", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			Name: "Samuel",
			property_to_delete: "value",
		}),
	);
	const after = new TextEncoder().encode(
		JSON.stringify({
			Name: "Samuel",
		}),
	);

	const changes = mockChanges({
		file: createMockFile({}),
		fileUpdates: [before, after],
	});

	const { fileData: applied } = applyChanges({
		file: createMockFile({ data: before }),
		changes,
	} as ApplyChangesArgs);

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(after),
	);
});

test("it applies array changes using json pointers", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			list: ["a", "b", "c"],
		}),
	);
	const after = new TextEncoder().encode(
		JSON.stringify({
			list: ["a", "x", "c", "d"],
		}),
	);

	const changes = mockChanges({
		file: createMockFile({}),
		fileUpdates: [before, after],
	});

	const { fileData: applied } = applyChanges({
		file: createMockFile({ data: before }),
		changes,
	} as ApplyChangesArgs);

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(after),
	);
});
