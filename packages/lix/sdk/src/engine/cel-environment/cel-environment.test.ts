import { describe, expect, test } from "vitest";
import { createCelEnvironment } from "./cel-environment.js";
import { openLix } from "../../lix/open-lix.js";

describe("createCelEnvironment (v3)", () => {
	test("evaluates literal expressions", async () => {
		const lix = await openLix({});
		const env = createCelEnvironment({ engine: lix.engine! });
		expect(env.evaluate("'draft'", {})).toBe("draft");
		await lix.close();
	});

	test("returns values from registered functions", async () => {
		const lix = await openLix({});
		const env = createCelEnvironment({ engine: lix.engine! });
		const value = env.evaluate("lix_uuid_v7()", {});
		expect(typeof value).toBe("string");
		await lix.close();
	});
});
