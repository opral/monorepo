import React, { Suspense } from "react";
import { describe, expect, test, vi } from "vitest";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { openLix, type Lix } from "@lix-js/sdk";
import { plugin as mdPlugin } from "../../../lix/plugin-md/dist";
import { LixProvider } from "@lix-js/react-utils";
import { KeyValueProvider } from "@/key-value/use-key-value";
import { KEY_VALUE_DEFINITIONS } from "@/key-value/schema";
import { LeftSidebarFiles } from "./left-sidebar-files";
import { SidebarProvider } from "@/components/ui/sidebar";

function Providers({ children, lix }: { children: React.ReactNode; lix: Lix }) {
	return (
		<LixProvider lix={lix}>
			<KeyValueProvider defs={KEY_VALUE_DEFINITIONS}>
				<SidebarProvider defaultOpen>{children}</SidebarProvider>
			</KeyValueProvider>
		</LixProvider>
	);
}

async function seedFs(lix: Lix, { activeFileId = "file_intro" } = {}) {
	await lix.db
		.insertInto("directory")
		.values({ path: "/docs/" } as any)
		.execute();

	await lix.db
		.insertInto("directory")
		.values({ path: "/docs/guides/" } as any)
		.execute();

	await lix.db
		.insertInto("file")
		.values({
			id: "file_intro",
			path: "/docs/guides/intro.md",
			data: new TextEncoder().encode("Intro"),
		})
		.execute();

	await lix.db
		.insertInto("file")
		.values({
			id: "file_overview",
			path: "/docs/overview.md",
			data: new TextEncoder().encode("Overview"),
		})
		.execute();

	await lix.db
		.insertInto("key_value_by_version")
		.values({
			key: "flashtype_active_file_id",
			value: activeFileId,
			lixcol_version_id: "global",
			lixcol_untracked: true,
		})
		.execute();
}

describe("LeftSidebarFiles", () => {
	test("selecting a directory highlights it instead of reverting to the active file", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });
		await seedFs(lix, { activeFileId: "file_intro" });

		await act(async () => {
			render(
				<Suspense>
					<Providers lix={lix}>
						<LeftSidebarFiles />
					</Providers>
				</Suspense>,
			);
		});

		const guidesFolder = (await screen.findByText(/^guides$/i)).closest(
			"button",
		);
		expect(guidesFolder).toBeTruthy();

		const introFile = (await screen.findByText(/intro\.md/i)).closest("button");
		expect(introFile).toBeTruthy();

		// Select the directory (first click opens & should highlight)
		await act(async () => {
			fireEvent.click(guidesFolder!);
		});

		await waitFor(() => {
			expect(guidesFolder!.getAttribute("data-selected")).toBe("true");
			expect(introFile!.parentElement?.getAttribute("data-active")).not.toBe(
				"true",
			);
		});
	});

	test("clicking a file updates the selection and active file", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });
		await seedFs(lix, { activeFileId: "file_intro" });

		await act(async () => {
			render(
				<Suspense>
					<Providers lix={lix}>
						<LeftSidebarFiles />
					</Providers>
				</Suspense>,
			);
		});

		const overviewButton = (await screen.findByText(/overview\.md/i)).closest(
			"button",
		);
		expect(overviewButton).toBeTruthy();

		await act(async () => {
			fireEvent.click(overviewButton!);
		});

		await waitFor(() => {
			expect(overviewButton!.parentElement?.getAttribute("data-active")).toBe(
				"true",
			);
		});

		const keyRow = await lix.db
			.selectFrom("key_value_by_version")
			.where("key", "=", "flashtype_active_file_id")
			.selectAll()
			.executeTakeFirst();

		expect(keyRow?.value).toBe("file_overview");
	});

	test("creating a file uses the selected directory", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });
		await seedFs(lix, { activeFileId: "file_intro" });
		const closeFile = vi.fn();
		const closeDir = vi.fn();

		const defaultProps = {
			onRequestCloseCreateFile: closeFile,
			onRequestCloseCreateDirectory: closeDir,
		};

		const { rerender } = render(
			<Suspense>
				<Providers lix={lix}>
					<LeftSidebarFiles {...defaultProps} />
				</Providers>
			</Suspense>,
		);

		const selectFile = async () => {
			const button = (await screen.findByText(/intro\.md/i)).closest("button");
			expect(button).toBeTruthy();
			await act(async () => {
				fireEvent.click(button!);
			});
		};

		await selectFile();

		const rerenderWith = (props: Record<string, unknown>) =>
			rerender(
				<Suspense>
					<Providers lix={lix}>
						<LeftSidebarFiles {...defaultProps} {...props} />
					</Providers>
				</Suspense>,
			);

		rerenderWith({ creatingFile: true });

		const input = await screen.findByPlaceholderText("new-file");
		expect(input.closest('[data-sidebar="menu-sub"]')).toBeTruthy();
		await act(async () => {
			fireEvent.change(input, { target: { value: "notes" } });
			fireEvent.keyDown(input, { key: "Enter" });
		});

		await waitFor(() => expect(closeFile).toHaveBeenCalled());
		rerenderWith({ creatingFile: false });

		await waitFor(async () => {
			const row = await lix.db
				.selectFrom("file")
				.selectAll()
				.where("path", "=", "/docs/guides/notes.md")
				.executeTakeFirst();
			expect(row).toBeTruthy();
		});

		await waitFor(() => {
			const activeContainer = screen
				.getByText(/notes\.md/i)
				.closest("div[data-active='true']");
			expect(activeContainer).toBeTruthy();
		});
	});

	test("creating a directory nests it under the selected path", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });
		await seedFs(lix, { activeFileId: "file_intro" });
		const closeFile = vi.fn();
		const closeDir = vi.fn();

		const defaultProps = {
			onRequestCloseCreateFile: closeFile,
			onRequestCloseCreateDirectory: closeDir,
		};

		const { rerender } = render(
			<Suspense>
				<Providers lix={lix}>
					<LeftSidebarFiles {...defaultProps} />
				</Providers>
			</Suspense>,
		);

		const selectFile = async () => {
			const button = (await screen.findByText(/intro\.md/i)).closest("button");
			expect(button).toBeTruthy();
			await act(async () => {
				fireEvent.click(button!);
			});
		};

		await selectFile();

		const rerenderWith = (props: Record<string, unknown>) =>
			rerender(
				<Suspense>
					<Providers lix={lix}>
						<LeftSidebarFiles {...defaultProps} {...props} />
					</Providers>
				</Suspense>,
			);

		rerenderWith({ creatingDirectory: true });

		const input = await screen.findByPlaceholderText("new-directory");
		expect(input.closest('[data-sidebar="menu-sub"]')).toBeTruthy();
		await act(async () => {
			fireEvent.change(input, { target: { value: "notes" } });
			fireEvent.keyDown(input, { key: "Enter" });
		});

		await waitFor(() => expect(closeDir).toHaveBeenCalled());
		rerenderWith({ creatingDirectory: false });

		await waitFor(async () => {
			const row = await lix.db
				.selectFrom("directory")
				.selectAll()
				.where("path", "=", "/docs/guides/notes/")
				.executeTakeFirst();
			expect(row).toBeTruthy();
		});

		await waitFor(() =>
			expect(screen.getByText(/^notes$/i).closest("button")).toHaveAttribute(
				"data-selected",
				"true",
			),
		);
	});

	test("clicking outside cancels inline file creation", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });
		await seedFs(lix, { activeFileId: "file_intro" });
		const closeFile = vi.fn();

		render(
			<Suspense>
				<Providers lix={lix}>
					<LeftSidebarFiles
						creatingFile
						onRequestCloseCreateFile={closeFile}
						onRequestCloseCreateDirectory={() => {}}
					/>
				</Providers>
			</Suspense>,
		);

		await screen.findByPlaceholderText("new-file");
		fireEvent.pointerDown(document.body);
		await waitFor(() => expect(closeFile).toHaveBeenCalled());
	});

	test("clicking outside cancels inline directory creation", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });
		await seedFs(lix, { activeFileId: "file_intro" });
		const closeDir = vi.fn();

		render(
			<Suspense>
				<Providers lix={lix}>
					<LeftSidebarFiles
						creatingDirectory
						onRequestCloseCreateFile={() => {}}
						onRequestCloseCreateDirectory={closeDir}
					/>
				</Providers>
			</Suspense>,
		);

		await screen.findByPlaceholderText("new-directory");
		fireEvent.pointerDown(document.body);
		await waitFor(() => expect(closeDir).toHaveBeenCalled());
	});
});
