import { expect, test } from "vitest";

test.skip("inserting a file for the same path should not lead to two different ids/files", async () => {
	const lix = {} as any;
	const file1 = await lix.file.write("/path/to/file", "content");
	const file2 = await lix.file.write("/path/to/file", "content");
	expect(file1.id).toBe(file2.id);

	const files = await lix.db.selectFrom("file").selectAll().execute();
	expect(files.length).toBe(1);
});
