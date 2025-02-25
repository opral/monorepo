import { fileQueueSettled, newLixFile, openLixInMemory } from "@lix-js/sdk";
import { expect, test } from "vitest";
import { lixPluginJson } from "./lixplugin.js";

test("it applies an insert change", async () => {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [lixPluginJson],
	  });
	  
	  const json = {
		nested: {
		  name: "John",
		},
	  };
	  
	  const file = await lix.db
		.insertInto("file")
		.values({
		  path: "/src/automation.json",
		  data: new TextEncoder().encode(JSON.stringify(json)),
		})
		.returning("id")
		.executeTakeFirstOrThrow();
	  
	  await fileQueueSettled({ lix });
	  
	  const changes = await lix.db
		.selectFrom("change")
		.where("change.file_id", "=", file.id)
		.where("entity_id", "=", "nested.name")
		.selectAll("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll()
		.execute();


		expect(changes).toMatchObject([
			{
			entity_id: "nested.name",
			schema_key: "lix_plugin_json_property",
			plugin_key: "lix_plugin_json",
			content: {
				property: "nested.name",
				value: "John",
			},
			},
		]);
});
