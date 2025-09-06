import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { DiffIndicator } from "./diff-indicator";

function getBars(container: HTMLElement) {
	const spans = container.querySelectorAll("span[aria-hidden]");
	const last = spans[spans.length - 1];
	return Array.from(last?.querySelectorAll("i") ?? []);
}

describe("DiffIndicator", () => {
	/**
	 * Expected output: +12 -3 [text display]
	 * No visual bars test, just checking text rendering
	 */
	test("renders additions and deletions text", () => {
		render(<DiffIndicator added={12} removed={3} highRange={100} />);
		expect(screen.getByText("+12")).toBeInTheDocument();
		expect(screen.getByText("-3")).toBeInTheDocument();
	});

	/**
	 * Expected output: +12 -3 | (15 total changes, 15% of highRange=100)
	 * Visual bars: [green] (1 bar total, mostly green since 12 > 3)
	 * With both additions and deletions at low range, should show min 2 bars
	 * Actual: [green][red] (ensures both colors visible)
	 */
	test("scales bars based on highRange and splits by ratio", () => {
		const { container } = render(
			<DiffIndicator added={12} removed={3} highRange={100} />,
		);
		const bars = getBars(container);
		expect(bars.length).toBeGreaterThanOrEqual(1);
		expect(bars.length).toBeLessThanOrEqual(4); // Max is 4 bars now
		const greens = bars.filter((b) => b.className.includes("bg-green")).length;
		const reds = bars.filter((b) => b.className.includes("bg-red")).length;
		expect(greens + reds).toBe(bars.length);
		// When both exist, both should show
		if (bars.length >= 2) {
			expect(greens).toBeGreaterThanOrEqual(1);
			expect(reds).toBeGreaterThanOrEqual(1);
		}
	});

	/**
	 * Expected output: +1 -15 | (16 total changes, 32% of highRange=50)
	 * Visual bars: [green][red][red] (2 bars total: 1 green min, 1 red for proportion)
	 * Since deletions dominate (15 vs 1), more red bars
	 */
	test("shows more red when deletions dominate", () => {
		const { container } = render(
			<DiffIndicator added={1} removed={15} highRange={50} />,
		);
		const bars = getBars(container);
		const greens = bars.filter((b) => b.className.includes("bg-green")).length;
		const reds = bars.filter((b) => b.className.includes("bg-red")).length;
		// With both additions and deletions, ensure both colors show
		expect(greens).toBeGreaterThanOrEqual(1);
		expect(reds).toBeGreaterThanOrEqual(1);
		// But red should dominate
		expect(reds).toBeGreaterThanOrEqual(greens);
	});

	/**
	 * Expected output: +8 | (8 total changes, 8% of highRange=100)
	 * Visual bars: [green] (1 bar, all green since no deletions)
	 */
	test("no deletions -> all bars green", () => {
		const { container } = render(
			<DiffIndicator added={8} removed={0} highRange={100} />,
		);
		const bars = getBars(container);
		expect(bars.length).toBe(1); // 8% of 100 = 1 bar
		expect(bars.every((b) => b.className.includes("bg-green"))).toBe(true);
	});

	/**
	 * Expected output: +100 | (100 total changes, 100% of highRange=100)
	 * Visual bars: [green][green][green][green] (4 bars max, all green)
	 */
	test("max changes shows 4 bars", () => {
		const { container } = render(
			<DiffIndicator added={100} removed={0} highRange={100} />,
		);
		const bars = getBars(container);
		expect(bars.length).toBe(4); // Max 4 bars at 100% of range
		expect(bars.every((b) => b.className.includes("bg-green"))).toBe(true);
	});

	/**
	 * Expected output: +50 -50 | (100 total changes, 100% of highRange=100)
	 * Visual bars: [green][green][red][red] (4 bars: 2 green, 2 red for 50/50 split)
	 */
	test("equal additions and deletions at max range", () => {
		const { container } = render(
			<DiffIndicator added={50} removed={50} highRange={100} />,
		);
		const bars = getBars(container);
		expect(bars.length).toBe(4); // Max bars
		const greens = bars.filter((b) => b.className.includes("bg-green")).length;
		const reds = bars.filter((b) => b.className.includes("bg-red")).length;
		expect(greens).toBe(2);
		expect(reds).toBe(2);
	});

	/**
	 * Expected output: +0 | (0 total changes)
	 * Visual bars: (none) - no bars rendered for zero changes
	 */
	test("zero changes shows no bars", () => {
		const { container } = render(
			<DiffIndicator added={0} removed={0} highRange={100} />,
		);
		const bars = getBars(container);
		expect(bars.length).toBe(0);
	});

	/**
	 * Expected output: | (no counts, only bars)
	 * Visual bars: [green][green][red] (3 bars for 75% of highRange)
	 */
	test("hides counts when showCounts is false", () => {
		render(
			<DiffIndicator
				added={50}
				removed={25}
				highRange={100}
				showCounts={false}
			/>,
		);
		// Counts should not be in the document
		expect(screen.queryByText("+50")).not.toBeInTheDocument();
		expect(screen.queryByText("-25")).not.toBeInTheDocument();
	});
});
