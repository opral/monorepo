import { describe, expect, test } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { LixProvider, useLix } from "@lix-js/react-utils";
import { openLix } from "@lix-js/sdk";
import { plugin as mdPlugin } from "../../../../lix/plugin-md/dist";
import { ChatInput } from "./chat-input";
import * as React from "react";

function Harness() {
	const lix = useLix();
	const [below, setBelow] = React.useState<React.ReactNode | null>(null);
	return (
		<div>
			<ChatInput
				variant="flat"
				renderBelow={setBelow}
				onSend={() => {}}
				onQueryMentions={async (q: string) => {
					if (q.length === 0) {
						const all = await lix.db
							.selectFrom("file")
							.select(["path"])
							.orderBy("path")
							.limit(10)
							.execute();
						return all.map((r: any) => String(r.path));
					}
					const rows = await lix.db
						.selectFrom("file")
						.where("path", "like", `%${q}%`)
						.select(["path"])
						.orderBy("path")
						.limit(10)
						.execute();
					return rows.map((r: any) => String(r.path));
				}}
			/>
			<div data-testid="below">{below}</div>
		</div>
	);
}

async function seedFiles(
	lix: Awaited<ReturnType<typeof openLix>>,
	count: number,
) {
	const values = Array.from({ length: count }, (_, i) => {
		const n = String(i + 1).padStart(2, "0");
		return { id: `f_${n}`, path: `/file-${n}.md`, data: new Uint8Array() };
	});
	await lix.db
		.insertInto("file")
		.values(values as any)
		.execute();
}

describe("Chat mentions with @", () => {
	test("typing '@' lists up to 10 files (default suggestions)", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });
		await seedFiles(lix, 12); // create 12 files

		render(
			<LixProvider lix={lix}>
				<Harness />
			</LixProvider>,
		);

		// Focus the prompt and type '@'
		const ta = await screen.findByPlaceholderText(
			'Prompt or try a command with "/"',
		);
		// Set value and ensure caret is at the end so mention regex matches
		(ta as HTMLTextAreaElement).focus();
		await act(async () => {
			fireEvent.change(ta, { target: { value: "@" } });
			(ta as HTMLTextAreaElement).setSelectionRange(1, 1);
		});

		// Expect 10 suggestions (file-01 .. file-10 by path order)
		await screen.findByText("/file-01.md");
		expect(screen.queryByText("/file-11.md")).toBeNull();
		expect(screen.getByText("/file-10.md")).toBeInTheDocument();
	});
});

describe("Slash commands with /", () => {
	test("typing '/' opens the command list and shows default commands", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });
		// No files needed for slash; render harness
		render(
			<LixProvider lix={lix}>
				<Harness />
			</LixProvider>,
		);

		const ta = await screen.findByPlaceholderText(
			'Prompt or try a command with "/"',
		);
		(ta as HTMLTextAreaElement).focus();
		await act(async () => {
			fireEvent.change(ta, { target: { value: "/" } });
			(ta as HTMLTextAreaElement).setSelectionRange(1, 1);
		});

		// Default commands include /clear
		await screen.findByText("/clear");
	});
});
