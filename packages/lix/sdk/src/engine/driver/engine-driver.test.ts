import { test, expect } from "vitest";
import { Kysely } from "kysely";
import { createDialect } from "./engine-driver.js";
import { createMainMemoryEngine } from "../main-thread.js";

test("EngineDriver runs basic Kysely queries", async () => {
  const engine = createMainMemoryEngine();
  await engine.init({});

  const db = new Kysely<any>({ dialect: createDialect({ engine }) });

  await db.executeQuery({ sql: "CREATE TABLE t(a)", parameters: [] } as any);
  await db.executeQuery({ sql: "INSERT INTO t(a) VALUES (?), (?)", parameters: [1, 2] } as any);

  const res = await db.executeQuery({ sql: "SELECT a FROM t ORDER BY a", parameters: [] } as any);
  expect((res.rows as any[]).length).toBe(2);
  expect((res.rows as any[])[0]?.a ?? (res.rows as any[])[0]?.[0]).toBe(1);
});

