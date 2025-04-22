import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import {
	validate as validateZettelDoc,
	type ZettelDoc,
} from "@opral/zettel-ast";

export function applyThreadDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	// Register the validate_zettel_doc function directly on this sqlite instance
	sqlite.createFunction({
		name: "validate_zettel_doc",
		arity: 1,
		xFunc: (_ctx: number, value) => {
			const result = validateZettelDoc(JSON.parse(value as string));
			if (result.errors) {
				throw new Error(
					"The Zettel Doc is invalid: " + result.errors.join("\n")
				);
			}
			return 1;
		},
		deterministic: true,
	});

	const sql = `
  CREATE TABLE IF NOT EXISTS thread (
    id TEXT PRIMARY KEY DEFAULT (nano_id())
  ) STRICT;

  CREATE TABLE IF NOT EXISTS thread_comment (
    id TEXT PRIMARY KEY DEFAULT (nano_id()),
    thread_id TEXT NOT NULL,
    parent_id TEXT,

    content BLOB NOT NULL, --JSONB
    FOREIGN KEY(thread_id) REFERENCES thread(id),
    FOREIGN KEY(parent_id) REFERENCES thread_comment(id)
  ) STRICT;

  -- TEMP TRIGGER to validate ZettelDoc for inserts
  CREATE TEMP TRIGGER IF NOT EXISTS validate_thread_comment_content_insert
  BEFORE INSERT ON thread_comment
  FOR EACH ROW
  BEGIN
    SELECT
      CASE
        WHEN validate_zettel_doc(json(NEW.content)) = 0
        THEN RAISE(ABORT, 'Invalid ZettelDoc: content must be a valid ZettelDoc')
      END;
  END;

  -- TEMP TRIGGER to validate ZettelDoc for upserts/updates
  CREATE TEMP TRIGGER IF NOT EXISTS validate_thread_comment_content_update
  BEFORE UPDATE OF content ON thread_comment
  FOR EACH ROW
  BEGIN
    SELECT
      CASE
        WHEN validate_zettel_doc(json(NEW.content)) = 0
        THEN RAISE(ABORT, 'Invalid ZettelDoc: content must be a valid ZettelDoc')
      END;
  END;
`;

	return sqlite.exec(sql);
}

export type Thread = Selectable<ThreadTable>;
export type NewThread = Insertable<ThreadTable>;
export type ThreadUpdate = Updateable<ThreadTable>;
export type ThreadTable = {
	id: Generated<string>;
};

export type ThreadComment = Selectable<ThreadCommentTable>;
export type NewThreadComment = Insertable<ThreadCommentTable>;
export type ThreadCommentUpdate = Updateable<ThreadCommentTable>;
export type ThreadCommentTable = {
	id: Generated<string>;
	thread_id: string;
	parent_id: string | null;
	content: ZettelDoc;
};
