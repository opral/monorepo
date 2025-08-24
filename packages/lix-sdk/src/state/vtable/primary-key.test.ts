import { describe, expect, test } from "vitest";
import {
    encodeStatePkPart,
    parseStatePk,
    serializeStatePk,
} from "./primary-key.js";

describe("primary-key serialize/parse", () => {
	const tags = ["T", "TI", "U", "UI", "C", "CI"] as const;

	test.each(tags as unknown as string[])("roundtrips for tag %s", (tag) => {
		const fileId = "file~id/with%chars";
		const entityId = "entity~id:123%$";
		const versionId = "version~id%alpha";

		const pk = serializeStatePk(tag as any, fileId, entityId, versionId);
		const parsed = parseStatePk(pk);

		expect(parsed.tag).toBe(tag);
		expect(parsed.fileId).toBe(fileId);
		expect(parsed.entityId).toBe(entityId);
		expect(parsed.versionId).toBe(versionId);
	});

	test("encodeStatePkPart escapes '~' and '%' safely", () => {
		const original = "val~with%percent and /slashes?&";
		const encoded = encodeStatePkPart(original);

		// No raw '~' should remain in encoded part
		expect(encoded).not.toContain("~");
		// Encoded should be reversible
		const pk = ["U", encoded, encoded, encoded].join("~");
		const parsed = parseStatePk(pk);
		expect(parsed.fileId).toBe(original);
		expect(parsed.entityId).toBe(original);
		expect(parsed.versionId).toBe(original);
	});

	test("parseStatePk throws on invalid format", () => {
		expect(() => parseStatePk("only-one-part" as any)).toThrow(
			/Invalid composite key/
		);
	});
});
