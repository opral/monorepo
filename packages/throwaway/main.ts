import { openLixBackend, OpfsSahWorker, InMemory } from "@lix-js/sdk";

async function bootstrap() {
  const modeEl = document.getElementById("mode") as HTMLSelectElement;
  const valueEl = document.getElementById("value")!;
  const tIncEl = document.getElementById("t-inc")!;
  const tSelEl = document.getElementById("t-select")!;
  const tSpamEl = document.getElementById("t-spam")!;
  const tSeedEl = document.getElementById("t-seed")!;
  const countEl = document.getElementById("count") as HTMLInputElement;
  const rowsEl = document.getElementById("rows")!;
  const refreshRowsBtn = document.getElementById("refresh-rows") as HTMLButtonElement;
  const wrapEl = document.getElementById("wrap") as HTMLInputElement;
  const seedBtn = document.getElementById("seed1g") as HTMLButtonElement;

  let lix: Awaited<ReturnType<typeof openLixBackend>> | null = null;

  async function initEngine() {
    if (lix) await lix.close();
    const mode = modeEl.value as "worker" | "main";
    const backend = mode === "worker" ? OpfsSahWorker({ name: "throwaway.lix" }) : InMemory();
    lix = await openLixBackend({ backend });
    // Ensure tables
    await lix.db.executeQuery({ sql: "CREATE TABLE IF NOT EXISTS kv(key TEXT PRIMARY KEY, value INTEGER)", parameters: [] } as any);
    await lix.db.executeQuery({ sql: "CREATE TABLE IF NOT EXISTS spam(x INTEGER)", parameters: [] } as any);
    await refresh();
  }

  async function refresh() {
    if (!lix) return;
    const t0 = performance.now();
    const res = await lix.db.executeQuery({ sql: "SELECT value FROM kv WHERE key = 'counter'", parameters: [] } as any);
    const dt = performance.now() - t0;
    tSelEl.textContent = dt.toFixed(1);
    const rows = res.rows as any[];
    valueEl.textContent = rows.length > 0 ? String(rows[0].value ?? rows[0][0]) : "0";
    await refreshRowCount();
  }

  async function refreshRowCount() {
    if (!lix) return;
    const res = await lix.db.executeQuery({ sql: "SELECT COUNT(*) as c FROM spam", parameters: [] } as any);
    const count = (res.rows as any[])[0]?.c ?? (res.rows as any[])[0]?.[0] ?? 0;
    rowsEl.textContent = String(count);
  }

  async function increment() {
    if (!lix) return;
    const t0 = performance.now();
    await lix.db.transaction().execute(async (trx) => {
      await trx.executeQuery({
        sql: "INSERT INTO kv(key, value) VALUES('counter', 1) ON CONFLICT(key) DO UPDATE SET value = value + 1",
        parameters: [],
      } as any);
    });
    const dt = performance.now() - t0;
    tIncEl.textContent = dt.toFixed(1);
    await refresh();
  }

  async function spamInsert() {
    if (!lix) return;
    const n = Math.max(1, Number(countEl.value) | 0);
    const t0 = performance.now();
    const wrap = wrapEl.checked;
    if (wrap) {
      await lix.db.transaction().execute(async (trx) => {
        for (let i = 0; i < n; i++) {
          await trx.executeQuery({ sql: "INSERT INTO spam(x) VALUES (?)", parameters: [i] } as any);
        }
      });
    } else {
      // Intentionally do row-by-row inserts without a transaction to maximize UI pressure in main-thread mode
      for (let i = 0; i < n; i++) {
        await lix.db.executeQuery({ sql: "INSERT INTO spam(x) VALUES (?)", parameters: [i] } as any);
      }
    }
    const dt = performance.now() - t0;
    tSpamEl.textContent = `${dt.toFixed(1)} ms for ${n} inserts`;
    await refresh();
  }

  document.getElementById("inc")!.addEventListener("click", increment);
  document.getElementById("reset")!.addEventListener("click", async () => {
    if (!lix) return;
    await lix.db.transaction().execute(async (trx) => {
      await trx.executeQuery({ sql: "DELETE FROM kv WHERE key='counter'", parameters: [] } as any);
    });
    await refresh();
  });
  document.getElementById("spam")!.addEventListener("click", spamInsert);
  modeEl.addEventListener("change", initEngine);
  refreshRowsBtn.addEventListener("click", refreshRowCount);
  seedBtn.addEventListener("click", async () => {
    if (!lix) return;
    seedBtn.disabled = true;
    tSeedEl.textContent = " seeding…";
    const t0 = performance.now();
    try {
      // Create seed table if missing
      await lix.db.executeQuery({ sql: "CREATE TABLE IF NOT EXISTS seed(id INTEGER PRIMARY KEY AUTOINCREMENT, data BLOB)", parameters: [] } as any);
      const rows = 1024; // ~1GiB with 1MiB per row
      const size = 1024 * 1024;
      await lix.db.transaction().execute(async (trx) => {
        for (let i = 0; i < rows; i++) {
          await trx.executeQuery({ sql: "INSERT INTO seed(data) VALUES (randomblob(?))", parameters: [size] } as any);
          if (i % 64 === 0) {
            tSeedEl.textContent = ` ${i}/${rows}…`;
          }
        }
      });
      const dt = performance.now() - t0;
      tSeedEl.textContent = ` done in ${dt.toFixed(1)} ms`;
      await refreshRowCount();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      tSeedEl.textContent = ` error: ${String((e as any)?.message ?? e)}`;
    } finally {
      seedBtn.disabled = false;
    }
  });

  await initEngine();
}

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  document.body.insertAdjacentHTML("beforeend", `<pre>${String(e)}</pre>`);
});
