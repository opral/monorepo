import React, { Suspense } from "react";
import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
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
});
