import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { ComponentProps } from "react";
import { PromptComposer } from "./prompt-composer";
import { COMMANDS } from "../commands/index";

const TEST_FILES = ["docs/readme.md", "src/app.ts", "README.md"];

function renderComposer(
	overrides: Partial<ComponentProps<typeof PromptComposer>> = {},
) {
	const props: ComponentProps<typeof PromptComposer> = {
		hasKey: true,
		commands: COMMANDS,
		files: TEST_FILES,
		pending: false,
		models: [{ id: "claude-3-opus", label: "Claude 3 Opus" }],
		modelId: "claude-3-opus",
		onModelChange: vi.fn(),
		autoAcceptEnabled: false,
		onAutoAcceptToggle: vi.fn().mockResolvedValue(undefined),
		onNotice: vi.fn(),
		onSlashCommand: vi.fn().mockResolvedValue(undefined),
		onSendMessage: vi.fn().mockResolvedValue(undefined),
		...overrides,
	};
	render(<PromptComposer {...props} />);
	const textarea = screen.getByTestId(
		"agent-composer-input",
	) as HTMLTextAreaElement;
	const sendButton = screen.getByTestId("agent-composer-send");
	return {
		props,
		textarea,
		sendButton,
	};
}

describe("PromptComposer", () => {
	test("shows matching slash commands for partial input", async () => {
		const { textarea } = renderComposer();
		fireEvent.change(textarea, { target: { value: "/h" } });
		await waitFor(() => {
			expect(screen.getByText("/help")).toBeInTheDocument();
		});
	});

	test("does not open slash menu for file-like mentions", async () => {
		const { textarea } = renderComposer();
		fireEvent.change(textarea, { target: { value: "/docs/readme.md" } });
		await waitFor(() => {
			expect(screen.queryByText("/help")).toBeNull();
		});
	});

	test("closes slash menu once whitespace follows the command", async () => {
		const { textarea } = renderComposer();
		fireEvent.change(textarea, { target: { value: "/clear done" } });
		await waitFor(() => {
			expect(screen.queryByText("/clear")).toBeNull();
		});
	});

	test("opens mention suggestions when typing @", async () => {
		const { textarea } = renderComposer();
		fireEvent.change(textarea, { target: { value: "@" } });
		await screen.findByText("docs/readme.md");
	});

	test("caps history at twenty entries and surfaces newest first", async () => {
		const onSendMessage = vi.fn().mockResolvedValue(undefined);
		const { textarea, sendButton } = renderComposer({ onSendMessage });

		for (let i = 0; i < 25; i++) {
			await act(async () => {
				fireEvent.change(textarea, { target: { value: `message-${i}` } });
				fireEvent.click(sendButton);
			});
			await waitFor(() => {
				expect(onSendMessage).toHaveBeenCalledTimes(i + 1);
			});
		}

		await act(async () => {
			fireEvent.keyDown(textarea, { key: "ArrowUp" });
		});
		await waitFor(() => {
			expect(textarea.value).toBe("message-24");
		});

		for (let i = 1; i < 20; i++) {
			await act(async () => {
				fireEvent.keyDown(textarea, { key: "ArrowUp" });
			});
		}
		expect(textarea.value).toBe("message-5");

		await act(async () => {
			fireEvent.keyDown(textarea, { key: "ArrowUp" });
		});
		expect(textarea.value).toBe("message-5");
	});

	test("does not enter history navigation while editing a draft", async () => {
		const onSendMessage = vi.fn().mockResolvedValue(undefined);
		const { textarea, sendButton } = renderComposer({ onSendMessage });

		await act(async () => {
			fireEvent.change(textarea, { target: { value: "previous message" } });
			fireEvent.click(sendButton);
		});
		await waitFor(() => {
			expect(onSendMessage).toHaveBeenCalledWith("previous message");
			expect(textarea.value).toBe("");
		});

		const draft = ["line one", "line two", "line three"].join("\n");
		fireEvent.change(textarea, { target: { value: draft } });
		textarea.setSelectionRange(draft.length, draft.length);

		await act(async () => {
			fireEvent.keyDown(textarea, { key: "ArrowUp" });
		});

		expect(textarea.value).toBe(draft);
	});

	test("auto accept toggle forwards next value", async () => {
		const onAutoAcceptToggle = vi.fn().mockResolvedValue(undefined);
		renderComposer({ onAutoAcceptToggle });
		const toggleButton = screen.getByRole("button", {
			name: /Enable auto accept/i,
		});
		fireEvent.click(toggleButton);
		await waitFor(() => {
			expect(onAutoAcceptToggle).toHaveBeenCalledWith(true);
		});
	});
});
