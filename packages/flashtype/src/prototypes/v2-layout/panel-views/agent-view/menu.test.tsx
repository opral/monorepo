import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { CommandMenu, MentionMenu } from "./menu";

const COMMANDS = [
	{ name: "clear", description: "Clear conversation" },
	{ name: "help", description: "Show help" },
];

describe("MentionMenu", () => {
	test("highlights the selected item", () => {
		render(<MentionMenu items={["config.json", "README.md"]} selectedIndex={1} />);
		expect(screen.getByText("README.md")).toHaveClass("bg-zinc-100");
	});

	test("renders nothing when list is empty", () => {
		const { container } = render(<MentionMenu items={[]} selectedIndex={0} />);
		expect(container.firstChild).toBeNull();
	});
});

describe("CommandMenu", () => {
	test("shows command metadata", () => {
		render(<CommandMenu commands={COMMANDS} selectedIndex={0} />);
		expect(screen.getByText("/clear")).toBeInTheDocument();
		expect(screen.getByText("Clear conversation")).toBeInTheDocument();
	});

	test("renders empty state", () => {
		render(<CommandMenu commands={[]} selectedIndex={0} />);
		expect(screen.getByText("No commands")).toBeInTheDocument();
	});
});
