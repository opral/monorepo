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
	metadata = { unique_column: "Name" },
	path = "/mock.csv",
}: {
	data?: Uint8Array;
	metadata?: Record<string, unknown> | null;
	path?: string;
} = {}): ApplyChangesFile =>
	({
		id: "mock",
		directory_id: null,
		name: "mock",
		extension: "csv",
		path,
		data,
		metadata,
		lixcol_metadata: metadata,
		hidden: false,
		lixcol_inherited_from_version_id: null,
		lixcol_created_at: new Date().toISOString(),
		lixcol_updated_at: new Date().toISOString(),
	}) as ApplyChangesFile;

test("it applies an insert change", async () => {
	const before = new TextEncoder().encode(
		//
		"Name,Age\nAnna,20\nPeter,50",
	);
	const after = new TextEncoder().encode(
		// John, 30 is added between Anna and Peter
		"Name,Age\nAnna,20\nPeter,50\nJohn,30",
	);

	const metadata = { unique_column: "Name" };

	const changes = mockChanges({
		file: createMockFile({ metadata }),
		fileUpdates: [before, after],
	});

	// TODO changes comming from mock changes contain ALL changes not only the changes from before to after - is this intended?
	// TODO we ignore the ordering of the rows - FYI

	const { fileData: applied } = applyChanges({
		file: createMockFile({ data: before, metadata }),
		changes,
	} as ApplyChangesArgs);

	expect(applied).toEqual(after);
});

test("it applies an update change", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Name,Age\nAnna,21\nPeter,50");

	const metadata = { unique_column: "Name" };

	const changes = mockChanges({
		file: createMockFile({ metadata }),
		fileUpdates: [before, after],
	});

	const { fileData: applied } = applyChanges({
		file: createMockFile({ data: before, metadata }),
		changes,
	} as ApplyChangesArgs);

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(after),
	);
});

test("it applies a delete change", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Name,Age\nAnna,20");

	const metadata = { unique_column: "Name" };

	const changes = mockChanges({
		file: createMockFile({ metadata }),
		fileUpdates: [before, after],
	});

	const { fileData: applied } = applyChanges({
		file: createMockFile({ data: before, metadata }),
		changes,
	} as ApplyChangesArgs);
	expect(applied).toEqual(after);
});

test("it applies a row order change", async () => {
	const initial = new TextEncoder().encode(
		//
		"Name,Age\nAnna,20\nPeter,50\nJohn,30",
	);
	const update0 = new TextEncoder().encode(
		// john has been moved to the top
		"Name,Age\nJohn,30\nPeter,50\nAnna,20",
	);

	const metadata = { unique_column: "Name" };

	const changes = mockChanges({
		file: createMockFile({ metadata }),
		fileUpdates: [initial, update0],
	});

	const { fileData: applied } = applyChanges({
		file: createMockFile({ data: initial, metadata }),
		changes,
	} as ApplyChangesArgs);

	expect(applied).toEqual(update0);
});

test("applies changes to a new csv file", async () => {
	const initialCsv = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");

	const file = createMockFile({
		data: initialCsv,
		metadata: { unique_column: "Name" },
	});

	const changes = mockChanges({
		file,
		fileUpdates: [initialCsv],
	});

	const { fileData: applied } = await applyChanges({
		file: { ...file, data: undefined },
		changes,
	} as ApplyChangesArgs);

	expect(applied).toEqual(initialCsv);
});
