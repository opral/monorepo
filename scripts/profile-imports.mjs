#!/usr/bin/env node
/** Rebuild SDK and plugin dist first. See scripts/import-performance.md. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import inspector from "node:inspector";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const flags = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, "").split("=");
    return [key, value.join("=") || true];
  }),
);
const output = path.resolve(flags.output || "/tmp/inlang-import-profile.json");
const selected = flags.cases ? String(flags.cases).split(",") : null;
const iterations = Number(flags.iterations || 3);
if (!Number.isInteger(iterations) || iterations < 1)
  throw new Error("--iterations must be a positive integer");
const pluginCases = [
  "plugin-inlang-message-format-30x5000",
  "plugin-inlang-message-format-10x1000",
  "plugin-inlang-message-format-1x200",
  "plugin-i18next-2x3000",
  "plugin-i18next-1x3000-long",
  "plugin-json-10x1000",
  "plugin-next-intl-10x1000",
  "plugin-icu1-10x1000",
];
const validCases = new Set([
  ...pluginCases,
  ...pluginCases.map((id) => `${id}-export`),
  "sdk-fresh",
  "sdk-repeated",
  "sdk-duplicates",
  "sdk-json",
  "sdk-next-intl",
  "directory-message-format-10x1000",
  "directory-i18next-2x3000",
]);
for (const id of selected ?? [])
  if (!validCases.has(id)) throw new Error(`Unknown case: ${id}`);

const encoder = new TextEncoder();
const plugins = new Map();
const results = [];
const session = flags.cpu ? new inspector.Session() : null;
if (session) session.connect();
const post = (name, params = {}) =>
  new Promise((resolve, reject) =>
    session.post(name, params, (error, value) =>
      error ? reject(error) : resolve(value),
    ),
  );
const hash = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const sort = (rows) =>
  rows.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
const unique = (rows, key) => [
  ...new Map(rows.map((row) => [key(row), row])).values(),
];
function withVariantOrder(snapshot, variants) {
  const groups = new Map();
  for (const variant of variants) {
    const key = JSON.stringify(variant.message);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(variant);
  }
  Object.defineProperty(snapshot, "variantOrderDigest", {
    value: hash([...groups.entries()].sort(([a], [b]) => a.localeCompare(b))),
  });
  return snapshot;
}
function canonicalPlugin(rows) {
  const messageById = new Map(
    rows.messages
      .filter((m) => m.id)
      .map((m) => [m.id, [m.bundleId, m.locale]]),
  );
  const variants = rows.variants.map(
    ({ id, messageId, messageBundleId, messageLocale, ...row }) => ({
      ...row,
      message: messageId
        ? messageById.get(messageId)
        : [messageBundleId, messageLocale],
    }),
  );
  return withVariantOrder(
    {
      bundles: sort(unique(rows.bundles, (row) => row.id)),
      messages: sort(
        unique(
          rows.messages.map(({ id, ...row }) => row),
          (row) => JSON.stringify([row.bundleId, row.locale]),
        ),
      ),
      variants: sort(
        rows.variants.map(
          ({ id, messageId, messageBundleId, messageLocale, ...row }) => ({
            ...row,
            message: messageId
              ? messageById.get(messageId)
              : [messageBundleId, messageLocale],
          }),
        ),
      ),
    },
    variants,
  );
}
function exportable(rows) {
  const messages = unique(rows.messages, (row) =>
    JSON.stringify([row.bundleId, row.locale]),
  ).map((row, i) => ({
    ...row,
    id: row.id ?? `message-${i}`,
    selectors: row.selectors ?? [],
  }));
  const ids = new Map(
    messages.map((row) => [JSON.stringify([row.bundleId, row.locale]), row.id]),
  );
  return {
    bundles: rows.bundles.map((row) => ({
      ...row,
      declarations: row.declarations ?? [],
    })),
    messages,
    variants: rows.variants.map((row, i) => ({
      ...row,
      id: row.id ?? `variant-${i}`,
      messageId:
        row.messageId ??
        ids.get(JSON.stringify([row.messageBundleId, row.messageLocale])),
      matches: row.matches ?? [],
      pattern: row.pattern ?? [],
    })),
  };
}
async function canonicalDb(db) {
  const bundles = await db
    .selectFrom("inlang_bundle")
    .select(["id", "declarations"])
    .execute();
  const messages = await db
    .selectFrom("inlang_message")
    .select(["id", "bundle_id", "locale", "selectors"])
    .execute();
  const variants = await db
    .selectFrom("inlang_variant")
    .select(["id", "message_id", "matches", "pattern"])
    .orderBy("id")
    .execute();
  const refs = new Map(
    messages.map((row) => [row.id, [row.bundle_id, row.locale]]),
  );
  const orderedVariants = variants.map(({ id, message_id, ...row }) => ({
    ...row,
    message: refs.get(message_id),
  }));
  return withVariantOrder(
    {
      bundles: sort(bundles),
      messages: sort(messages.map(({ id, ...row }) => row)),
      variants: sort(
        variants.map(({ id, message_id, ...row }) => ({
          ...row,
          message: refs.get(message_id),
        })),
      ),
    },
    orderedVariants,
  );
}
async function plugin(name) {
  if (!plugins.has(name))
    plugins.set(
      name,
      (await import(path.join(root, `packages/plugins/${name}/dist/index.js`)))
        .default,
    );
  return plugins.get(name);
}
function fixture(name, locales, keys, { plurals = false, long = false } = {}) {
  const localeNames = Array.from({ length: locales }, (_, i) => `locale_${i}`);
  const files = localeNames.map((locale) => {
    const json = {};
    for (let i = 0; i < keys; i++) {
      if (plurals && i < 31) {
        json[`message${i}_one`] = "1 item";
        json[`message${i}_other`] = "{{count}} items";
      } else
        json[`message${i}`] = long
          ? `Static text ${locale} ${i} ` +
            "The quick brown fox jumps over the lazy dog. ".repeat(16)
          : i % 5 === 0
            ? `Hello ${name === "i18next" ? "{{name}}" : "{name}"} from ${locale} (#${i})`
            : i % 5 === 1
              ? `Count is ${name === "i18next" ? "{{count}}" : "{count}"} in ${locale}`
              : `Static text ${locale} ${i}`;
    }
    return { locale, content: encoder.encode(JSON.stringify(json)) };
  });
  return { files, localeNames };
}
async function measure(id, execute, repeat = iterations) {
  if (selected && !selected.includes(id)) return;
  console.log(`Starting ${id}`);
  const samples = [];
  let content;
  let queryCounts;
  let profile;
  if (session) await post("Profiler.enable");
  for (let i = 0; i < repeat; i++) {
    if (session) await post("Profiler.start");
    const start = performance.now();
    const measured = await execute();
    samples.push(performance.now() - start);
    if (session) ({ profile } = await post("Profiler.stop"));
    content =
      typeof measured.content === "function"
        ? await measured.content()
        : measured.content;
    queryCounts = measured.queryCounts;
  }
  let cpu;
  if (session) {
    const profilePath = `${output}.${id}.cpuprofile`;
    fs.writeFileSync(profilePath, JSON.stringify(profile));
    const counts = new Map();
    for (const node of profile.nodes) {
      const frame = node.callFrame;
      const label = `${frame.functionName || "(anonymous)"} (${frame.url}:${frame.lineNumber + 1})`;
      counts.set(label, (counts.get(label) || 0) + (node.hitCount || 0));
    }
    cpu = {
      path: profilePath,
      topSelfSamples: [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15),
    };
  }
  const row = {
    id,
    samplesMs: samples,
    medianMs: [...samples].sort((a, b) => a - b)[
      Math.floor(samples.length / 2)
    ],
    ...content,
    queryCounts,
    cpu,
  };
  results.push(row);
  fs.writeFileSync(output, JSON.stringify({ metadata, results }, null, 2));
  console.log(JSON.stringify(row));
}
const metadata = {
  node: process.version,
  platform: `${process.platform}/${process.arch}`,
  cpu: os.cpus()[0]?.model,
  commit: execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim(),
  timestamp: new Date().toISOString(),
  sdk: JSON.parse(fs.readFileSync(path.join(root, "packages/sdk/package.json")))
    .version,
  iterations,
};
for (const [name, locales, keys, options] of [
  ["inlang-message-format", 30, 5000],
  ["inlang-message-format", 10, 1000],
  ["inlang-message-format", 1, 200],
  ["i18next", 2, 3000, { plurals: true }],
  ["i18next", 1, 3000, { long: true }],
  ["json", 10, 1000],
  ["next-intl", 10, 1000],
  ["icu1", 10, 1000],
]) {
  const id = `plugin-${name}-${locales}x${keys}${options?.long ? "-long" : ""}`;
  if (selected && !selected.includes(id) && !selected.includes(`${id}-export`))
    continue;
  const p = await plugin(name);
  const { files, localeNames } = fixture(name, locales, keys, options);
  const settings = {
    baseLocale: localeNames[0],
    locales: localeNames,
    modules: [],
    [p.key]: { pathPattern: "./{locale}.json" },
  };
  let imported;
  await measure(id, async () => {
    imported = await p.importFiles({ files, settings });
    return {
      content: () => {
        const canonical = canonicalPlugin(imported);
        return {
          bundles: imported.bundles.length,
          messages: imported.messages.length,
          variants: imported.variants.length,
          duplicateMessages:
            imported.messages.length - canonical.messages.length,
          digest: hash(canonical),
          variantOrderDigest: canonical.variantOrderDigest,
        };
      },
    };
  });
  imported ??= await p.importFiles({ files, settings });
  const exportRows = exportable(imported);
  await measure(`${id}-export`, async () => {
    const files = await p.exportFiles({ ...exportRows, settings });
    return {
      content: () => ({
        files: files.length,
        digest: hash(
          sort(
            files.map((file) => ({
              locale: file.locale,
              name: file.name,
              content: JSON.parse(new TextDecoder().decode(file.content)),
            })),
          ),
        ),
      }),
    };
  });
}
const sdkCases = [
  "sdk-fresh",
  "sdk-repeated",
  "sdk-duplicates",
  "sdk-json",
  "sdk-next-intl",
  "directory-message-format-10x1000",
  "directory-i18next-2x3000",
];
if (!selected || sdkCases.some((id) => selected.includes(id))) {
  const { newProject, loadProjectInMemory, loadProjectFromDirectory } =
    await import(path.join(root, "packages/sdk/dist/index.js"));
  const { importFiles } = await import(
    flags["sdk-import"]
      ? path.resolve(String(flags["sdk-import"]))
      : path.join(root, "packages/sdk/dist/import-export/importFiles.js")
  );
  for (const id of sdkCases) {
    if (selected && !selected.includes(id)) continue;
    const directory = id.startsWith("directory");
    const name = id.includes("i18next")
      ? "i18next"
      : id === "sdk-json"
        ? "json"
        : id === "sdk-next-intl"
          ? "next-intl"
          : "inlang-message-format";
    const p = await plugin(name);
    const { files, localeNames } = fixture(
      name,
      directory ? (name === "i18next" ? 2 : 10) : 2,
      directory ? (name === "i18next" ? 3000 : 1000) : 100,
      { plurals: directory && name === "i18next" },
    );
    const settings = {
      baseLocale: localeNames[0],
      locales: localeNames,
      modules: [],
      [p.key]: { pathPattern: "./{locale}.json" },
    };
    const provided =
      id === "sdk-duplicates"
        ? {
            ...p,
            importFiles: async (args) => {
              const rows = await p.importFiles(args);
              rows.messages.push({ ...rows.messages[0] });
              return rows;
            },
          }
        : p;
    let project;
    let temp;
    let queryCounts;
    const counter = {
      transformQuery(args) {
        const kind = args.node.kind;
        queryCounts[kind] = (queryCounts[kind] || 0) + 1;
        return args.node;
      },
      async transformResult(args) {
        return args.result;
      },
    };
    if (directory) {
      temp = fs.mkdtempSync(
        path.join(os.tmpdir(), "inlang-import-performance-"),
      );
      fs.mkdirSync(path.join(temp, "project.inlang"));
      fs.writeFileSync(
        path.join(temp, "project.inlang/settings.json"),
        JSON.stringify(settings),
      );
      for (const file of files)
        fs.writeFileSync(path.join(temp, `${file.locale}.json`), file.content);
    } else {
      project = await loadProjectInMemory({
        blob: await newProject({ settings }),
        providePlugins: [provided],
      });
    }
    if (id === "sdk-repeated")
      await importFiles({
        files,
        settings,
        pluginKey: p.key,
        plugins: [provided],
        db: project.db,
      });
    try {
      await measure(
        id,
        async () => {
          queryCounts = {};
          if (directory)
            project = await loadProjectFromDirectory({
              path: path.join(temp, "project.inlang"),
              fs,
              providePlugins: [provided],
            });
          else
            await importFiles({
              files,
              settings,
              pluginKey: p.key,
              plugins: [provided],
              db: project.db.withPlugin(counter),
            });
          return {
            queryCounts: { ...queryCounts },
            content: async () => {
              const content = await canonicalDb(project.db);
              if (directory) {
                await project.close();
                project = null;
              }
              return {
                bundles: content.bundles.length,
                messages: content.messages.length,
                variants: content.variants.length,
                digest: hash(content),
                variantOrderDigest: content.variantOrderDigest,
              };
            },
          };
        },
        1,
      );
    } finally {
      if (project) await project.close();
      if (temp) fs.rmSync(temp, { recursive: true, force: true });
    }
  }
}
if (session) session.disconnect();
if (flags.compare) {
  const before = JSON.parse(fs.readFileSync(path.resolve(flags.compare)));
  for (const after of results) {
    const baseline = before.results.find((row) => row.id === after.id);
    if (!baseline) continue;
    console.log(
      JSON.stringify({
        case: after.id,
        speedup: baseline.medianMs / after.medianMs,
        sameContent: baseline.digest === after.digest,
        sameVariantOrder: baseline.variantOrderDigest
          ? baseline.variantOrderDigest === after.variantOrderDigest
          : undefined,
        beforeMs: baseline.medianMs,
        afterMs: after.medianMs,
      }),
    );
    if (
      baseline.digest !== after.digest ||
      (baseline.variantOrderDigest &&
        baseline.variantOrderDigest !== after.variantOrderDigest)
    )
      process.exitCode = 1;
  }
}
