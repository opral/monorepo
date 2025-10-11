import { describe, expect, test } from "vitest";
import {
	tokenize,
	INSERT,
	UPDATE,
	DELETE,
} from "../../sql-parser/tokenizer.js";
import { readDmlTarget } from "./read-dml-target.js";

describe("readDmlTarget", () => {
	test("extracts insert target after INTO", () => {
		const tokens = tokenize("INSERT INTO my_view VALUES (?)");
		const target = readDmlTarget(tokens, "insert");
		expect(target).toBe("my_view");
	});

	test("handles quoted identifiers", () => {
		const tokens = tokenize('INSERT INTO "MyView" DEFAULT VALUES');
		const target = readDmlTarget(tokens, "insert");
		expect(target).toBe("MyView");
	});

	test("skips conflict clauses for update", () => {
		const tokens = tokenize("UPDATE OR REPLACE target_view SET id = 1");
		const target = readDmlTarget(tokens, "update");
		expect(target).toBe("target_view");
	});

	test("reads delete target", () => {
		const tokens = tokenize("DELETE FROM test_view WHERE id = 1");
		const target = readDmlTarget(tokens, "delete");
		expect(target).toBe("test_view");
	});
});
