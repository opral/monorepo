import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export function applyThreadDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	const sql = `
  CREATE TABLE IF NOT EXISTS thread (
    id TEXT PRIMARY KEY DEFAULT (nano_id())
  ) STRICT;

  CREATE TABLE IF NOT EXISTS thread_comment (
    id TEXT PRIMARY KEY DEFAULT (nano_id()),
    thread_id TEXT NOT NULL,
    parent_id TEXT,
    content TEXT NOT NULL,
    FOREIGN KEY(thread_id) REFERENCES thread(id),
    FOREIGN KEY(parent_id) REFERENCES thread_comment(id)
  ) STRICT;
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
	content: string;
};
