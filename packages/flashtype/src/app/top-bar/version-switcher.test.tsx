import React, { Suspense } from "react";
import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { LixProvider } from "@lix-js/react-utils";
import { createVersion, openLix, type Lix } from "@lix-js/sdk";
import { VersionSwitcher } from "./version-switcher";

describe("VersionSwitcher", () => {
	let lix: Lix;
	let cleanupFns: Array<() => Promise<void>> = [];

	const renderWithProviders = async () => {
		await act(async () => {
			render(
				<LixProvider lix={lix}>
					<Suspense fallback={null}>
						<VersionSwitcher />
					</Suspense>
				</LixProvider>,
			);
		});
	};

	beforeEach(async () => {
		lix = await openLix({});
		cleanupFns.push(() => lix.close());

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.select(["version.id"])
			.executeTakeFirstOrThrow();

		await lix.db
			.updateTable("version")
			.set({ name: "main" })
			.where("id", "=", activeVersion.id)
			.execute();
	});

	afterEach(async () => {
		vi.restoreAllMocks();

		for (const fn of cleanupFns.splice(0)) {
			await fn();
		}
	});

	test("renders the active version name", async () => {
		await renderWithProviders();

		const trigger = await screen.findByRole("button", {
			name: "Select version",
		});
		expect(trigger).toHaveTextContent("main");
	});

	test("switches to another version when selected", async () => {
		const newVersion = await createVersion({ lix, name: "draft" });

		await renderWithProviders();

		const trigger = await screen.findByRole("button", {
			name: "Select version",
		});

		await act(async () => {
			fireEvent.pointerDown(trigger, { button: 0 });
			fireEvent.pointerUp(trigger, { button: 0 });
		});

		const draftItem = await screen.findByRole("menuitem", { name: "draft" });

		await act(async () => {
			fireEvent.click(draftItem);
		});

		expect(
			await screen.findByRole("button", { name: "Select version" }),
		).toHaveTextContent("draft");

		const active = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();
		expect(active.version_id).toBe(newVersion.id);
	});

	test("renames a version via actions menu", async () => {
		const target = await createVersion({ lix, name: "docs" });
		const promptSpy = vi.fn().mockReturnValue("docs-renamed");
		vi.stubGlobal("prompt", promptSpy);

		await renderWithProviders();

		await act(async () => {
			fireEvent.pointerDown(
				screen.getByRole("button", { name: "Select version" }),
			);
			fireEvent.pointerUp(
				screen.getByRole("button", { name: "Select version" }),
			);
		});

		const actionsButton = await screen.findByRole("button", {
			name: "Version actions for docs",
		});
		await act(async () => {
			fireEvent.pointerDown(actionsButton, { button: 0 });
			fireEvent.pointerUp(actionsButton, { button: 0 });
		});

		const renameItem = await screen.findByRole("menuitem", { name: "Rename" });
		await act(async () => {
			fireEvent.click(renameItem);
		});

		await waitFor(() => {
			expect(screen.getByText("docs-renamed")).toBeInTheDocument();
		});

		const row = await lix.db
			.selectFrom("version")
			.select(["id", "name"])
			.where("id", "=", target.id)
			.executeTakeFirstOrThrow();
		expect(row.name).toBe("docs-renamed");
	});

	test("deletes a version via actions menu", async () => {
		const target = await createVersion({ lix, name: "temp" });
		const confirmSpy = vi.fn().mockReturnValue(true);
		vi.stubGlobal("confirm", confirmSpy);

		await renderWithProviders();

		await act(async () => {
			fireEvent.pointerDown(
				screen.getByRole("button", { name: "Select version" }),
			);
			fireEvent.pointerUp(
				screen.getByRole("button", { name: "Select version" }),
			);
		});

		const actionsButton = await screen.findByRole("button", {
			name: "Version actions for temp",
		});
		await act(async () => {
			fireEvent.pointerDown(actionsButton, { button: 0 });
			fireEvent.pointerUp(actionsButton, { button: 0 });
		});

		const deleteItem = await screen.findByRole("menuitem", { name: "Delete" });
		await act(async () => {
			fireEvent.click(deleteItem);
		});

		await act(async () => {
			fireEvent.pointerDown(
				screen.getByRole("button", { name: "Select version" }),
			);
			fireEvent.pointerUp(
				screen.getByRole("button", { name: "Select version" }),
			);
		});

		await waitFor(() => {
			expect(
				screen.queryByRole("menuitem", { name: "temp" }),
			).not.toBeInTheDocument();
		});

		const row = await lix.db
			.selectFrom("version")
			.select(["id", "hidden"])
			.where("id", "=", target.id)
			.executeTakeFirstOrThrow();
		expect(row.hidden).toBeTruthy();

		const active = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();
		expect(active.version_id).not.toBe(target.id);

		confirmSpy.mockRestore();
	});

	test("delete action is disabled for active version", async () => {
		await renderWithProviders();

		await act(async () => {
			fireEvent.pointerDown(
				screen.getByRole("button", { name: "Select version" }),
			);
			fireEvent.pointerUp(
				screen.getByRole("button", { name: "Select version" }),
			);
		});

		const actionsButton = await screen.findByRole("button", {
			name: "Version actions for main",
		});
		await act(async () => {
			fireEvent.pointerDown(actionsButton, { button: 0 });
			fireEvent.pointerUp(actionsButton, { button: 0 });
		});

		const deleteItem = await screen.findByRole("menuitem", { name: "Delete" });
		expect(deleteItem).toHaveAttribute("data-disabled");
	});
});
