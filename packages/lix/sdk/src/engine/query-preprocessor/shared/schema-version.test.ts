import { describe, expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { getSchemaVersion, normalizeIdentifier } from "./schema-version.js";

describe("normalizeIdentifier", () => {
	test("lowercases plain identifiers", () => {
		expect(normalizeIdentifier("TestView")).toBe("testview");
	});

	test("strips quotes and unescapes", () => {
		expect(normalizeIdentifier('"Quoted"')).toBe("quoted");
		expect(normalizeIdentifier('"With""Quote"')).toBe('with"quote');
	});
});

describe("getSchemaVersion", () => {
	test("reflects schema_version changes", async () => {
		const lix = await openLix({});

		const initial = getSchemaVersion(lix.engine!.sqlite);

		lix.engine!.sqlite.exec("CREATE TABLE schema_version_probe (id INTEGER)");

		const afterCreate = getSchemaVersion(lix.engine!.sqlite);
		expect(afterCreate).not.toBe(initial);

		lix.engine!.sqlite.exec("DROP TABLE schema_version_probe");

		const afterDrop = getSchemaVersion(lix.engine!.sqlite);
		expect(afterDrop).not.toBe(afterCreate);

		await lix.close();
	});
});
