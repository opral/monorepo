import { useState, useRef, useEffect, useCallback } from "react";
import { PlateElementProps } from "@udecode/plate/react";
import { useQuery } from "@/hooks/useQuery";
import { selectActiveFile, selectLix } from "@/queries";
import { useChat } from "./use-chat";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Loader2, Zap } from "lucide-react";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs";
import { generateHumanId } from "@/helper/generateHumanId";
import { updateUrlParams } from "@/helper/updateUrlParams";
import {
	removeEmptyPromptElement,
	setPromptDismissed,
} from "@/helper/emptyPromptElementHelpers";
import { AIChatPlugin } from "@udecode/plate-ai/react";
import { nanoid } from "@lix-js/sdk";

export function EmptyDocumentPromptElement({
	attributes,
	editor,
}: PlateElementProps) {
	const [prompt, setPrompt] = useState("");
	const [activeFile] = useQuery(selectActiveFile);
	const [lix, , , refetch] = useQuery(selectLix);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const chat = useChat({
		streamProtocol: "text",
		onFinish: () => {
			setPrompt("");
		},
	});

	const { status } = chat;
	const isLoading = status === "streaming" || status === "submitted";

	// Adjust textarea height when content changes
	const adjustHeight = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	};

	const createNewFile = useCallback(
		async (content?: string) => {
			if (!lix) return;

			try {
				// Use prompt-based name if generating content, otherwise use random ID
				const fileBaseName = content
					? prompt
							.trim()
							.toLowerCase()
							.split(/\s+/)
							.reduce((acc: string[], word: string) => {
								if (
									(acc.join("-") + (acc.length ? "-" : "") + word).length <= 30
								) {
									acc.push(word);
								}
								return acc;
							}, [])
							.join("-")
					: generateHumanId();

				const newFileId = nanoid();

				await lix.db
					.insertInto("file")
					.values({
						id: newFileId,
						path: `/${fileBaseName}.md`,
						data: new TextEncoder().encode(``),
					})
					.executeTakeFirstOrThrow();

				await saveLixToOpfs({ lix });
				updateUrlParams({ f: newFileId });
				refetch();

				// Return the new file ID for later use
				return newFileId;
			} catch (error) {
				console.error("Failed to create new file:", error);
				return null;
			}
		},
		[lix, refetch, prompt]
	);

	// Initialize height and reset on changes
	useEffect(() => {
		adjustHeight();
	}, [prompt]);

	// Handle document generation
	const handleGenerateDocument = async () => {
		if (!activeFile || !prompt.trim()) return;

		try {
			// If we're in the default empty document, create a new file first
			if (activeFile.path === "/document.md") {
				const newFileId = await createNewFile(prompt);
				if (newFileId) {
					// Wait longer for navigation and editor synchronization to complete
					await new Promise((resolve) => setTimeout(resolve, 500));

					// Clear the editor content before starting generation
					const currentEditor = editor;
					if (currentEditor) {
						currentEditor.tf.setValue([]);
					}
				} else {
					// If file creation failed, stay in current file
					toast.error(
						"Failed to create new file. Generating in current file instead."
					);
				}
			}
			editor.getApi(AIChatPlugin).aiChat.submit({
				prompt: `Generate a complete, well-structured markdown document about: ${prompt}. Include appropriate headings starting with level 1 heading (#), paragraphs, and relevant formatting like lists or emphasis where appropriate.`,
			});
		} catch (error) {
			console.error("Error starting document generation:", error);
			toast.error("Failed to generate document. Please try again.");
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter") {
			if (e.shiftKey) {
				// Allow line break with Shift+Enter
				return;
			}
			// Prevent default to avoid form submission
			e.preventDefault();

			// Submit if not already generating
			if (!isLoading && prompt.trim()) {
				handleGenerateDocument();
			}
		}
	};

	// Function to remove the prompt element
	const handleDismiss = async () => {
		if (activeFile?.id) {
			removeEmptyPromptElement(editor);
			// Mark this file as having dismissed the prompt
			if (lix) {
				try {
					setPromptDismissed(lix, activeFile.id);
				} catch (error) {
					console.error("Error saving prompt dismissed state:", error);
				}
			}
		}
	};

	return (
		<div {...attributes} contentEditable={false}>
			<form
				className="my-8 flex flex-col items-end justify-center w-full p-1 gap-2 border border-border rounded-md focus-within:ring-1 relative overflow-hidden"
				onSubmit={(e) => {
					e.preventDefault();
					handleGenerateDocument();
				}}
			>
				<textarea
					ref={textareaRef}
					id="prompt"
					className="w-full min-h-8 p-3 border-none focus:outline-none resize-none overflow-hidden"
					placeholder="What do you want to write?"
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					onKeyDown={handleKeyDown}
				/>

				<div className="flex gap-2 max-w-full">
					{!isLoading && (
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onClick={handleDismiss}
							disabled={isLoading}
						>
							Dismiss
						</Button>
					)}
					<Button
						type="submit"
						size="sm"
						disabled={isLoading || !prompt.trim()}
					>
						{isLoading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Generating...
							</>
						) : (
							<>
								<Zap className="h-4 w-4" />
								Generate
							</>
						)}
					</Button>
				</div>
			</form>
		</div>
	);
}
