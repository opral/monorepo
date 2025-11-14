import { expect } from "vitest";
import { withWriterKey } from "../../state/writer.js";
import { simulationTest } from "../../test-utilities/simulation-test/simulation-test.js";

simulationTest(
	"insert, update, delete on the directory view",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({});

		await lix.db
			.insertInto("directory")
			.values([
				{
					parent_id: null,
					name: "docs",
				},
			])
			.execute();

		let [rootDir] = await lix.db
			.selectFrom("directory")
			.where("name", "=", "docs")
			.selectAll()
			.execute();

		expect(rootDir?.name).toBe("docs");
		expect(rootDir?.parent_id).toBeNull();
		expect(rootDir?.hidden).toBe(0);

		await lix.db
			.insertInto("directory")
			.values([
				{
					parent_id: rootDir!.id,
					name: "api",
				},
			])
			.execute();

		let directories = await lix.db
			.selectFrom("directory")
			.selectAll()
			.orderBy("name")
			.execute();

		const apiDir = directories.find((dir) => dir.name === "api");

		expect(directories).toHaveLength(2);
		expect(apiDir?.parent_id).toBe(rootDir?.id);
		expect(apiDir?.hidden).toBe(0);

		await lix.db
			.updateTable("directory")
			.where("id", "=", apiDir!.id)
			.set({ name: "reference", hidden: true })
			.execute();

		directories = await lix.db
			.selectFrom("directory")
			.selectAll()
			.orderBy("name")
			.execute();

		const referenceDir = directories.find((dir) => dir.name === "reference");

		expect(referenceDir?.hidden).toBe(1);
		expect(referenceDir?.parent_id).toBe(rootDir?.id);

		await lix.db
			.deleteFrom("directory")
			.where("id", "=", referenceDir!.id)
			.execute();
		await lix.db
			.deleteFrom("directory")
			.where("id", "=", rootDir!.id)
			.execute();

		const remaining = await lix.db
			.selectFrom("directory")
			.selectAll()
			.execute();

		expect(remaining).toHaveLength(0);
	}
);

simulationTest(
	"directory views expose writer_key for descriptor rows",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({});
		const writerKey = "writer:directory#insert";

		await withWriterKey(lix.db, writerKey, async (trx) => {
			await trx
				.insertInto("directory")
				.values({
					parent_id: null,
					name: "docs",
				})
				.execute();
		});

		const directoryRow = await lix.db
			.selectFrom("directory")
			.where("name", "=", "docs")
			.select(["id", "lixcol_writer_key"])
			.executeTakeFirstOrThrow();

		expect(directoryRow.lixcol_writer_key).toBe(writerKey);

		const directoryAllRow = await lix.db
			.selectFrom("directory_by_version")
			.where("id", "=", directoryRow.id)
			.select(["id", "lixcol_writer_key"])
			.executeTakeFirstOrThrow();

		expect(directoryAllRow.lixcol_writer_key).toBe(writerKey);
	}
);
