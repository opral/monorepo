import { expect, test } from "vitest";
import { applyChanges } from "./applyChanges.js";
import { mockChanges } from "./utilities/mockChanges.js";

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
		file: { id: "mock", path: "/mock", metadata: {} },
		fileUpdates: [before, after],
	});

	const { fileData: applied } = applyChanges({
		file: { id: "mock", path: "/mock", data: before, metadata: {} },
		changes,
	});

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
		file: { id: "mock", path: "/mock", metadata: {} },
		fileUpdates: [before, after],
	});

	const { fileData: applied } = applyChanges({
		file: { id: "mock", path: "/mock", data: before, metadata: {} },
		changes,
	});

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
		file: { id: "mock", path: "/mock", metadata: {} },
		fileUpdates: [before, after],
	});

	const { fileData: applied } = applyChanges({
		file: { id: "mock", path: "/mock", data: before, metadata: {} },
		changes,
	});

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(after),
	);
});
