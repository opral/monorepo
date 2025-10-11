import { expect, test } from "vitest";
import {
	createInMemoryDatabase,
	importDatabase,
} from "../database/sqlite/index.js";
import { newLixFile } from "../lix/new-lix.js";
import { boot } from "./boot.js";

test("boot installs engine and triggers plugin on file insert", async () => {
	const sqlite = await createInMemoryDatabase({ readOnly: false });
	try {
		// Seed with a fresh Lix snapshot
		const blob = await newLixFile();
		const buf = new Uint8Array(await blob.arrayBuffer());
		importDatabase({ db: sqlite, content: buf });

		// Minimal plugin that matches *.md and emits one entity
		const pluginCode = `
      export const plugin = {
        key: 'test_plugin',
        detectChangesGlob: '*.md',
        detectChanges: ({ after }) => {
          return [{
            entity_id: 'e1',
            schema: {
              "x-lix-key": "test_item",
              "x-lix-version": "1.0",
              "x-lix-primary-key": ["/id"],
              "type": "object",
              "properties": { "id": {"type": "string"}, "title": {"type": "string"} },
              "required": ["id", "title"],
              "additionalProperties": false
            },
            snapshot_content: { id: 'e1', title: 'Hello' }
          }];
        }
      };
    `;

		const events: any[] = [];
		const engine = await boot({
			sqlite,
			emit: (ev) => events.push(ev),
			args: { providePluginsRaw: [pluginCode] },
		});

		// Sanity check: execSync should return rows as mapped objects including column names.
		const execResult = engine.executeSync({ sql: "select 1 as value" });
		expect(execResult.rows).toEqual([{ value: 1 }]);

		// Insert a markdown file; plugin should detect a change
		const data = new Uint8Array([1, 2, 3]);
		sqlite.exec({
			sql: `INSERT INTO file (id, path, data, metadata, hidden) VALUES (?, ?, ?, json(?), 0)`,
			bind: ["f1", "/doc.md", data, JSON.stringify({})],
			returnValue: "resultRows",
		});

		// Verify the plugin-produced entity exists
		const rows = sqlite.exec({
			sql: `SELECT COUNT(*) FROM state WHERE schema_key = 'test_item'`,
			returnValue: "resultRows",
		}) as any[];
		const count = Number(rows?.[0]?.[0] ?? 0);
		expect(count).toBeGreaterThan(0);

		// Verify a state_commit event was bridged
		expect(events.find((e) => e?.type === "state_commit")).toBeTruthy();
	} finally {
		sqlite.close();
	}
});

test("execSync.rows returns a mapped object", async () => {
	const sqlite = await createInMemoryDatabase({ readOnly: false });
	try {
		const blob = await newLixFile();
		const buf = new Uint8Array(await blob.arrayBuffer());
		importDatabase({ db: sqlite, content: buf });

		const engine = await boot({
			sqlite,
			emit: () => {},
			args: {},
		});

		const result = engine.executeSync({
			sql: "select 42 as answer, 'meaning' as label",
		});

		expect(result.rows).toEqual([{ answer: 42, label: "meaning" }]);
	} finally {
		sqlite.close();
	}
});
