import { expect } from "vitest";
import { simulationTest } from "../test-utilities/simulation-test/simulation-test.js";

simulationTest(
	"inserting a file by path creates the first-level directory descriptor",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await lix.db
			.insertInto("file")
			.values({
				path: "/docs/readme.md",
				data: new TextEncoder().encode("hello"),
			})
			.execute();

		const directories = await lix.db
			.selectFrom("directory")
			.select(["name", "parent_id", "hidden"])
			.execute();

		expectDeterministic(directories).toEqual([
			{
				name: "docs",
				parent_id: null,
				hidden: 0,
			},
		]);
	}
);

simulationTest(
	"inserting a nested file creates all ancestor directory descriptors",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await lix.db
			.insertInto("file")
			.values({
				path: "/docs/guides/intro.md",
				data: new TextEncoder().encode("nested"),
			})
			.execute();

		const directories = await lix.db
			.selectFrom("directory")
			.select(["id", "name", "parent_id"])
			.execute();

		expectDeterministic(directories).toHaveLength(2);
		const docs = directories.find((dir) => dir.name === "docs");
		const guides = directories.find((dir) => dir.name === "guides");
		expectDeterministic(docs).toBeDefined();
		expectDeterministic(docs?.parent_id).toBeNull();
		expectDeterministic(guides).toBeDefined();
		expectDeterministic(guides?.parent_id).toBe(docs?.id);
	}
);

simulationTest(
	"deleting a directory removes all nested files and directories",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await lix.db
			.insertInto("file")
			.values({
				path: "/docs/guides/intro.md",
				data: new TextEncoder().encode("nested"),
			})
			.execute();

		const docs = await lix.db
			.selectFrom("directory")
			.where("name", "=", "docs")
			.select(["id"])
			.executeTakeFirst();

		expectDeterministic(docs).toBeDefined();

		await lix.db.deleteFrom("directory").where("id", "=", docs!.id).execute();

		const remainingDirectories = await lix.db
			.selectFrom("directory")
			.selectAll()
			.execute();
		const remainingFiles = await lix.db
			.selectFrom("file")
			.selectAll()
			.execute();

		expectDeterministic(remainingDirectories).toEqual([]);
		expectDeterministic(remainingFiles).toEqual([]);
	}
);

simulationTest(
	"inserting a directory directly populates the directory view",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await lix.db
			.insertInto("directory")
			.values({ name: "docs", parent_id: null })
			.execute();

		const directories = await lix.db
			.selectFrom("directory")
			.select(["name", "parent_id", "hidden"])
			.execute();

		expectDeterministic(directories).toEqual([
			{ name: "docs", parent_id: null, hidden: 0 },
		]);
	}
);

simulationTest(
	"duplicate root directory insertions are rejected",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await lix.db
			.insertInto("directory")
			.values({ name: "docs", parent_id: null })
			.execute();

		await expect(
			lix.db
				.insertInto("directory")
				.values({ name: "docs", parent_id: null })
				.execute()
		).rejects.toThrowError();
	}
);

simulationTest(
	"directory view exposes composed path for directories",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await lix.db
			.insertInto("directory")
			.values({ name: "docs", parent_id: null })
			.execute();

		const docs = await lix.db
			.selectFrom("directory")
			.where("name", "=", "docs")
			.select(["id"])
			.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("directory")
			.values({ name: "guides", parent_id: docs.id })
			.execute();

		const directoryPaths = await lix.db
			.selectFrom("directory")
			.select(["name", "parent_id", "path"] as any)
			.execute();

		expectDeterministic(directoryPaths).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: "docs", path: "/docs/" }),
				expect.objectContaining({ name: "guides", path: "/docs/guides/" }),
			])
		);
	}
);

// Future-proofing: ensure special dot segments never materialize as directory names.
simulationTest(
	"directory names cannot be dot segments",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await expect(
			lix.db
				.insertInto("directory")
				.values({ name: ".", parent_id: null })
				.execute()
		).rejects.toThrowError();

		await expect(
			lix.db
				.insertInto("directory")
				.values({ name: "..", parent_id: null })
				.execute()
		).rejects.toThrowError();

		await lix.db
			.insertInto("directory")
			.values({ name: "docs", parent_id: null })
			.execute();

		await expect(
			lix.db
				.insertInto("directory")
				.values({
					name: ".",
					parent_id: (
						await lix.db
							.selectFrom("directory")
							.where("name", "=", "docs")
							.select("id")
							.executeTakeFirstOrThrow()
					).id,
				})
				.execute()
		).rejects.toThrowError();

		await expect(
			lix.db
				.insertInto("directory")
				.values({
					name: "..",
					parent_id: (
						await lix.db
							.selectFrom("directory")
							.where("name", "=", "docs")
							.select("id")
							.executeTakeFirstOrThrow()
					).id,
				})
				.execute()
		).rejects.toThrowError();
	}
);

// Future-proofing: ensure all stored paths collapse canonically via NFC normalization.
simulationTest(
	"file and directory paths normalize to NFC",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const decomposedDir = "/Cafe\u0301/Guides/";
		const decomposedFile = "/Cafe\u0301/Guides/intro\u0301.md";
		const expectedParentDir = "/Café/";
		const expectedChildDir = "/Café/Guides/";
		const expectedFile = "/Café/Guides/intró.md";

		await lix.db
			.insertInto("file")
			.values({
				path: decomposedFile,
				data: new Uint8Array([1, 2, 3]),
			})
			.execute();

		const fileRow = await lix.db
			.selectFrom("file")
			.select(["path"])
			.executeTakeFirstOrThrow();
		expectDeterministic(fileRow.path).toBe(expectedFile);

		const directoryRows = await lix.db
			.selectFrom("directory")
			.select(["path"] as any)
			.orderBy("path")
			.execute();
		expectDeterministic(directoryRows.map((row: any) => row.path)).toEqual([
			expectedParentDir,
			expectedChildDir,
		]);
	}
);

simulationTest(
	"file paths cannot collide with directory descriptors at the same location",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await lix.db
			.insertInto("file")
			.values({
				path: "/docs/readme.md",
				data: new TextEncoder().encode("first"),
			})
			.execute();

		const docs = await lix.db
			.selectFrom("directory")
			.where("name", "=", "docs")
			.select(["id"])
			.executeTakeFirst();

		expect(docs, "directory descriptor should exist").toBeDefined();

		await expect(
			lix.db
				.insertInto("directory")
				.values({ name: "readme.md", parent_id: docs!.id })
				.execute()
		).rejects.toThrowError();
	}
);

simulationTest(
	"updating a directory to use a descendant as parent is rejected",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await lix.db
			.insertInto("directory")
			.values({ name: "docs", parent_id: null })
			.execute();

		const docs = await lix.db
			.selectFrom("directory")
			.where("name", "=", "docs")
			.select(["id"])
			.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("directory")
			.values({ name: "guides", parent_id: docs.id })
			.execute();

		const guides = await lix.db
			.selectFrom("directory")
			.where("name", "=", "guides")
			.select(["id"])
			.executeTakeFirstOrThrow();

		await expect(
			lix.db
				.updateTable("directory")
				.where("id", "=", docs.id)
				.set({ parent_id: guides.id })
				.execute()
		).rejects.toThrowError();
	}
);

simulationTest(
	"inserting a file into a hidden directory keeps the directory hidden",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await lix.db
			.insertInto("directory")
			.values({ name: "docs", parent_id: null })
			.execute();

		const docs = await lix.db
			.selectFrom("directory")
			.where("name", "=", "docs")
			.select(["id"])
			.executeTakeFirstOrThrow();

		await lix.db
			.updateTable("directory")
			.where("id", "=", docs.id)
			.set({ hidden: true })
			.execute();

		await lix.db
			.insertInto("file")
			.values({
				path: "/docs/readme.md",
				data: new TextEncoder().encode("hidden"),
			})
			.execute();

		const updatedDirectory = await lix.db
			.selectFrom("directory")
			.where("id", "=", docs.id)
			.select(["hidden"])
			.executeTakeFirst();

		expectDeterministic(updatedDirectory?.hidden).toBe(1);
	}
);

simulationTest(
	"inserting multiple files into the same directory reuses the directory descriptor",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await lix.db
			.insertInto("file")
			.values({
				path: "/docs/readme.md",
				data: new TextEncoder().encode("first"),
			})
			.execute();

		await lix.db
			.insertInto("file")
			.values({
				path: "/docs/changelog.md",
				data: new TextEncoder().encode("second"),
			})
			.execute();

		const directories = await lix.db
			.selectFrom("directory")
			.select(["name", "parent_id"])
			.execute();

		expectDeterministic(directories).toEqual([
			{ name: "docs", parent_id: null },
		]);
	}
);

simulationTest(
	"toggling a directory hidden flag does not mutate nested file hidden flags",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await lix.db
			.insertInto("file")
			.values({
				path: "/docs/readme.md",
				data: new TextEncoder().encode("content"),
			})
			.execute();

		await lix.db
			.updateTable("directory")
			.where("name", "=", "docs")
			.set({ hidden: true })
			.execute();

		const fileRow = await lix.db
			.selectFrom("file")
			.select(["hidden"])
			.executeTakeFirst();

		expectDeterministic(fileRow?.hidden).toBe(0);
	}
);

simulationTest(
	"toggling a file hidden flag does not mutate parent directory hidden flags",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await lix.db
			.insertInto("file")
			.values({
				path: "/docs/readme.md",
				data: new TextEncoder().encode("content"),
			})
			.execute();

		await lix.db
			.updateTable("file")
			.where("path", "=", "/docs/readme.md")
			.set({ hidden: true })
			.execute();

		const directoryRow = await lix.db
			.selectFrom("directory")
			.where("name", "=", "docs")
			.select(["hidden"])
			.executeTakeFirst();

		expectDeterministic(directoryRow?.hidden).toBe(0);
	}
);

simulationTest(
	"renaming a directory updates descendant file paths",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await lix.db
			.insertInto("file")
			.values({
				path: "/docs/guides/readme.md",
				data: new TextEncoder().encode("content"),
			})
			.execute();

		const docsDirectory = await lix.db
			.selectFrom("directory")
			.where("name", "=", "docs")
			.selectAll()
			.executeTakeFirstOrThrow();

		expectDeterministic(docsDirectory.path).toBe("/docs/");

		await lix.db
			.updateTable("directory")
			.set({ name: "articles" })
			.where("id", "=", docsDirectory.id)
			.execute();

		const updatedDirectory = await lix.db
			.selectFrom("directory")
			.where("id", "=", docsDirectory.id)
			.selectAll()
			.executeTakeFirstOrThrow();

		expectDeterministic(updatedDirectory.path).toBe("/articles/");

		const files = await lix.db.selectFrom("file").select(["path"]).execute();

		expectDeterministic(files).toEqual([
			{ path: "/articles/guides/readme.md" },
		]);
	}
);

simulationTest(
	"inserting a directory by path auto-creates missing ancestors",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await lix.db
			.insertInto("directory")
			.values({ path: "/guides/api/" } as any)
			.execute();

		const directories = await lix.db
			.selectFrom("directory")
			.select(["path"] as any)
			.orderBy("path")
			.execute();

		expectDeterministic(directories).toEqual(
			expect.arrayContaining([{ path: "/guides/" }, { path: "/guides/api/" }])
		);
	}
);
