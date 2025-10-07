import {
	render,
	screen,
	act,
	fireEvent,
	waitFor,
} from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { AgentView } from "./index";

vi.mock("@/components/agent-chat/chat-message-list", () => ({
	ChatMessageList: () => <div data-testid="messages" />,
}));

const mockUseQuery = vi.fn();

vi.mock("@lix-js/react-utils", () => ({
	useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

describe("AgentView composer", () => {
	beforeEach(() => {
		mockUseQuery.mockReset();
		mockUseQuery.mockReturnValue([
			{ path: "/nice.md" },
			{ path: "/docs/guide.md" },
		]);
	});

	test("selecting a file mention inserts trailing space and places caret after it", async () => {
		render(<AgentView />);

		const textarea = (await screen.findByTestId(
			"agent-composer-input",
		)) as HTMLTextAreaElement;
		await act(async () => {
			fireEvent.change(textarea, { target: { value: "@" } });
		});

		await screen.findByText("/nice.md");
		await act(async () => {
			fireEvent.keyDown(textarea, { key: "Enter" });
			await Promise.resolve();
		});

		expect(textarea.value).toBe("/nice.md ");
		expect(textarea.selectionStart).toBe(textarea.value.length);
		expect(textarea.selectionEnd).toBe(textarea.value.length);
		expect(screen.queryByText("/clear")).toBeNull();
	});

	test("slash menu filters commands as the user types", async () => {
		render(<AgentView />);

		const textarea = (await screen.findByTestId(
			"agent-composer-input",
		)) as HTMLTextAreaElement;
		await act(async () => {
			fireEvent.change(textarea, { target: { value: "/" } });
		});

		await screen.findByText("/clear");

		await act(async () => {
			fireEvent.change(textarea, { target: { value: "/c" } });
		});

		await screen.findByText("/clear");
		expect(screen.queryByText("/help")).toBeNull();
	});

	test("slash menu collapses after entering a space", async () => {
		render(<AgentView />);

		const textarea = (await screen.findByTestId(
			"agent-composer-input",
		)) as HTMLTextAreaElement;
		await act(async () => {
			fireEvent.change(textarea, { target: { value: "/" } });
		});
		await screen.findByText("/clear");

		await act(async () => {
			fireEvent.change(textarea, { target: { value: "/c" } });
		});
		await screen.findByText("/clear");

		await act(async () => {
			fireEvent.change(textarea, { target: { value: "/c run" } });
		});
		await waitFor(() => expect(screen.queryByText("/clear")).toBeNull());
	});
});
