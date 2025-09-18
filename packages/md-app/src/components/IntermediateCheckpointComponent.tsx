import { useState, useRef, useEffect } from "react"; // Added useRef, useEffect
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { UiDiffComponentProps, createCheckpoint, createConversation } from "@lix-js/sdk";
import { selectCheckpoints, selectWorkingChanges, selectWorkingChangeSet } from "@/queries";
import { ChangeDiffComponent } from "@/components/ChangeDiffComponent.tsx";
import ChangeDot from "@/components/ChangeDot.tsx";
import { ChevronDown, Zap, Loader2 } from "lucide-react";
import { fromPlainText, ZettelDoc } from "@lix-js/sdk/zettel-ast";
import { useChat } from "@/components/editor/use-chat";
import { toast } from "sonner";
import { useLix, useQuery, useQueryTakeFirst } from "@lix-js/react-utils";

interface IntermediateCheckpointComponentProps {
  workingChanges?: UiDiffComponentProps["diffs"];
}

export const IntermediateCheckpointComponent = ({ workingChanges }: IntermediateCheckpointComponentProps) => {
  const [isExpandedState, setIsExpandedState] = useState<boolean>(true);
  const checkpointChangeSets = useQuery(({ lix }) => selectCheckpoints(lix));

  // Don't render anything if there's no change data
  if (workingChanges!.length === 0) {
    return null;
  }

  // Group changes by plugin_key
  const groupedChanges = workingChanges!.reduce((acc: { [key: string]: UiDiffComponentProps["diffs"] }, change) => {
    const key = change.plugin_key;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(change);
    return acc;
  }, {});

  return (
    <div
      className="flex group hover:bg-slate-50 rounded-md cursor-pointer flex-shrink-0 pr-2"
      onClick={(e) => {
        if ((e.target as HTMLElement).tagName !== "TEXTAREA" && (e.target as HTMLElement).tagName !== "BUTTON") {
          // Prevent click event from propagating to the textarea and button
          e.stopPropagation();
          setIsExpandedState(!isExpandedState);
        }
      }}
    >
      <ChangeDot top={false} bottom={!!checkpointChangeSets && checkpointChangeSets.length > 0} highlighted />
      <div className="flex-1 z-10">
        <div className="h-12 flex items-center w-full gap-2">
          <p className="flex-1 truncate text-ellipsis overflow-hidden text-sm">
            Intermediate changes{" "}
          </p>
          <div className="flex gap-3 items-center">
            <Button variant="ghost" size="icon" onClick={() => setIsExpandedState(!isExpandedState)}>
              <ChevronDown
                className={clsx(
                  isExpandedState ? "rotate-180" : "rotate-0",
                  "transition"
                )}
              />
            </Button>
          </div>
        </div>
        {isExpandedState && (
          <div className="flex flex-col gap-2 pb-2">
            <div className="flex flex-col justify-center items-start w-full gap-4 sm:gap-6 pt-2 pb-4 sm:pb-6 overflow-hidden">
              <CreateCheckpointInput />
              {Object.keys(groupedChanges).map((pluginKey) => (
                <ChangeDiffComponent
                  key={pluginKey}
                  diffs={groupedChanges[pluginKey]}
                  contentClassName="text-sm" /* Set font size to 14px (text-sm in Tailwind) */
                // debug={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntermediateCheckpointComponent;

const CreateCheckpointInput = () => {
  const [description, setDescription] = useState("");
  const lix = useLix();
  const currentChangeSet = useQueryTakeFirst(selectWorkingChangeSet);
  const workingChanges = useQuery(({ lix }) => selectWorkingChanges(lix));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const chat = useChat({
    streamProtocol: "text",
    onResponse: async (res: Response) => {
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let currentDescription = "";
      // Ensure we start from an empty description if we are generating a new one.
      // This is handled by setDescription("") in handleGenerateDescription before calling chat.append
      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        currentDescription += decoder.decode(value, { stream: true });
        setDescription(currentDescription);
      }
    },
    onFinish: () => {
      setIsGeneratingDescription(false);
    },
    onError: (error: { message: any; }) => {
      toast.error(error.message || "Failed to generate description.");
      setIsGeneratingDescription(false);
    }
  });

  const onThreadComposerSubmit = async (args: { content: ZettelDoc }) => {
    if (!description.trim() || !lix) return;

    await lix.db.transaction().execute(async (trx) => {
      // Get the commit associated with the current change set
      const commit = await trx
        .selectFrom("commit")
        .where("change_set_id", "=", currentChangeSet!.id)
        .selectAll()
        .executeTakeFirstOrThrow();

      // Create conversation with commit entity
      await createConversation({
				lix: { ...lix, db: trx },
				comments: [{ body: args.content }],
				entity: commit,
			});
    });
  };

  const handleCreateCheckpoint = async () => {
    // Ensure description is not empty and lix is available before proceeding
    if (!description.trim() || isGeneratingDescription || !lix) return;
    await onThreadComposerSubmit({ content: fromPlainText(description!) });
    await createCheckpoint({ lix });
    // OpfsStorage now handles persistence automatically through the onStateCommit hook
    setDescription(""); // Clear description after submission
  };

  const handleGenerateDescription = async () => {
    if (!workingChanges || workingChanges.length === 0) {
      toast.info("No changes to describe.");
      return;
    }
    if (isGeneratingDescription) return;

    setIsGeneratingDescription(true);
    setDescription("");

    // Use the last change in the intermediate changes for generating the description
    const lastTextChange = workingChanges.filter(
      (change) => change.plugin_key === "lix_plugin_txt"
    ).slice(-1)[0];

    if (!lastTextChange) {
      toast.error("No text changes found.");
      setIsGeneratingDescription(false);
      return;
    }

    try {
      const changesSummary =
        `| Before:\n` +
        `${lastTextChange.snapshot_content_before?.["text"] || ``}` +
        '\n' +
        '| After:\n' +
        `${lastTextChange.snapshot_content_after?.["text"] || ``}`;

      console.log("Changes summary:", changesSummary);

      const promptForLLM = `Generate a concise commit message (ideally a short sentence, max 2-3 sentences) summarizing the following changes of the before and after state of a markdown text document. Focus on the intent or user-facing impact. Changes:\n${changesSummary}`;

      await chat.append({
        role: 'user',
        content: promptForLLM,
      });
    } catch (error) {
      console.error('Error starting description generation:', error);
      toast.error("Failed to generate description. Please try again.");
      setIsGeneratingDescription(false);
    }
  };

  // Adjust textarea height dynamically
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [description]);

  // Handle key down in the comment textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (description.trim() && !isGeneratingDescription) {
        handleCreateCheckpoint();
      }
    }
  };

  return (
    <div className="flex flex-col w-full px-1">
      <div className="relative w-full">
        <textarea
          ref={textareaRef}
          className="flex-grow w-full min-h-[32px] rounded-md border border-input bg-background px-2 pt-[5px] pb-[7px] text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none overflow-hidden pr-8"
          placeholder={isGeneratingDescription ? "Generating description..." : "Describe the changes"}
          onChange={(event) => {
            setDescription(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          value={description}
          rows={1}
          disabled={isGeneratingDescription}
        />
        <Button
          onClick={handleGenerateDescription}
          variant="ghost"
          size="icon"
          aria-label="Generate description"
          className="absolute top-1 right-1 w-6 h-6 rounded-sm"
          disabled={isGeneratingDescription || !workingChanges || workingChanges.length === 0}
        >
          {isGeneratingDescription ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        </Button>
      </div>
      <Button
        size="sm"
        onClick={handleCreateCheckpoint}
        className="w-full"
        disabled={!description.trim() || isGeneratingDescription}
      >
        Create checkpoint
      </Button>
    </div>
  );
};
