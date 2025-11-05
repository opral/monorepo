import { Suspense } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { LixProvider } from "@lix-js/react-utils";
import { openLix } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";
import { MarkdownView } from "./index";
import { KeyValueProvider } from "@/hooks/key-value/use-key-value";
import { KEY_VALUE_DEFINITIONS } from "@/hooks/key-value/schema";

describe("MarkdownView", () => {
	test("renders an empty state when no file is provided", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });

		let utils: ReturnType<typeof render> | undefined;
		await act(async () => {
			utils = render(
				<LixProvider lix={lix}>
					<KeyValueProvider defs={KEY_VALUE_DEFINITIONS}>
						<Suspense fallback={null}>
							<MarkdownView />
						</Suspense>
					</KeyValueProvider>
				</LixProvider>,
			);
		});

		expect(
			screen.getByText(/select a markdown file to preview/i),
		).toBeInTheDocument();

		await act(async () => {
			utils?.unmount();
		});
	});

	test("renders the TipTap editor when file is found", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });
		await lix.db
			.insertInto("file")
			.values({
				id: "file_1",
				path: "/docs/readme.md",
				data: new TextEncoder().encode("# Hello world"),
			})
			.execute();

		await lix.db
			.insertInto("key_value_by_version")
			.values({
				key: "flashtype_active_file_id",
				value: "file_1",
				lixcol_version_id: "global",
				lixcol_untracked: true,
			})
			.execute();

		let utils: ReturnType<typeof render> | undefined;
		await act(async () => {
			utils = render(
				<LixProvider lix={lix}>
					<KeyValueProvider defs={KEY_VALUE_DEFINITIONS}>
						<Suspense fallback={null}>
							<MarkdownView fileId="file_1" filePath="/docs/readme.md" />
						</Suspense>
					</KeyValueProvider>
				</LixProvider>,
			);
		});

		expect(await screen.findByTestId("tiptap-editor")).toBeInTheDocument();

		await waitFor(async () => {
			const rows = await lix.db
				.selectFrom("key_value_by_version")
				.where("key", "=", "flashtype_active_file_id")
				.select(["value"])
				.execute();
			expect(rows[0]?.value).toBe("file_1");
		});

		await act(async () => {
			utils?.unmount();
		});
	});

	test("shows a not found message when the file is missing", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });

		let utils: ReturnType<typeof render> | undefined;
		await act(async () => {
			utils = render(
				<LixProvider lix={lix}>
					<KeyValueProvider defs={KEY_VALUE_DEFINITIONS}>
						<Suspense fallback={null}>
							<MarkdownView fileId="missing_file" />
						</Suspense>
					</KeyValueProvider>
				</LixProvider>,
			);
		});

		expect(screen.getByText(/file not found/i)).toBeInTheDocument();
		expect(screen.queryByTestId("tiptap-editor")).not.toBeInTheDocument();

		await act(async () => {
			utils?.unmount();
		});
	});
});
