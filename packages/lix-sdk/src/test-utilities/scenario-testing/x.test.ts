import { test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { scenarioTest } from "./scenario-test.js";

test("scenario test discovery", () => {});

await scenarioTest(
	"lix_id should be defined",
	async ({ scenario, expectDeterministic }) => {
		const lix = await openLix({});

		console.log("Testing scenario:", scenario);

		const keyValue = await lix.db
			.selectFrom("key_value")
			.where("key", "=", "lix_id")
			.selectAll()
			.execute();

		expectDeterministic(keyValue).toBeDefined();
	}
);
