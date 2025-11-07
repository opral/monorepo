import type { Lix } from "@lix-js/sdk";
import { newLixFile, openLix, createCheckpoint } from "@lix-js/sdk";
import mdPlugin from "@lix-js/plugin-md?raw";

// Raw-import seed markdown content via Vite
// eslint-disable-next-line import/no-unresolved
import whatIsLix from "./what-is-lix.md?raw";
// eslint-disable-next-line import/no-unresolved
import meetingNotes from "./meeting-notes.md?raw";
// eslint-disable-next-line import/no-unresolved
import changelog from "./changelog.md?raw";
// eslint-disable-next-line import/no-unresolved
import welcome from "./welcome.md?raw";
// eslint-disable-next-line import/no-unresolved
import agentsSeed from "./AGENTS.md?raw";

const encoder = new TextEncoder();

type SeedDoc = { path: string; content: string };

const SEED_DOCS: SeedDoc[] = [
	{ path: "/what-is-lix.md", content: whatIsLix },
	{ path: "/notes/meeting-notes.md", content: meetingNotes },
	{ path: "/docs/changelog.md", content: changelog },
	{ path: "/welcome.md", content: welcome },
];

export async function seedMarkdownFiles(lix: Lix): Promise<void> {
	for (const doc of SEED_DOCS) {
		const exists = await lix.db
			.selectFrom("file")
			.where("path", "=", doc.path)
			.select(["path"]) // small row
			.executeTakeFirst();

		const data = encoder.encode(doc.content);
		if (exists) {
			await lix.db
				.updateTable("file")
				.set({ data })
				.where("path", "=", doc.path)
				.execute();
		} else {
			await lix.db
				.insertInto("file")
				.values({ path: doc.path, data })
				.execute();
		}
	}
}

export async function ensureAgentsFile(lix: Lix): Promise<void> {
	const exists = await lix.db
		.selectFrom("file")
		.where("path", "=", "/AGENTS.md")
		.select(["path"])
		.executeTakeFirst();

	if (exists) return;

	const data = encoder.encode(agentsSeed);
	await lix.db
		.insertInto("file")
		.values({ path: "/AGENTS.md", data })
		.execute();
}

/**
 * Create a seeded Lix blob with AGENTS.md and an initial checkpoint.
 *
 * @example
 * const blob = await createSeededLixBlob();
 * await env.create({ blob: await blob.arrayBuffer() });
 */
export async function createSeededLixBlob(): Promise<Blob> {
	const seed = await newLixFile();
	const lix = await openLix({
		blob: seed,
		providePluginsRaw: [mdPlugin],
	});

	try {
		await ensureAgentsFile(lix);
		await createCheckpoint({ lix });
		return await lix.toBlob();
	} finally {
		await lix.close();
	}
}
