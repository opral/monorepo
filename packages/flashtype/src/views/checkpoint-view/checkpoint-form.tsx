import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CheckpointFormProps = {
	onCreateCheckpoint: () => void;
	isSubmitting?: boolean;
};

/**
 * Minimal checkpoint form – currently only supports creating a checkpoint
 * without an accompanying message.
 *
 * @example
 * <CheckpointForm onCreateCheckpoint={handleCreate} />
 */
export function CheckpointForm({
	onCreateCheckpoint,
	isSubmitting = false,
}: CheckpointFormProps) {
	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (isSubmitting) return;
		onCreateCheckpoint();
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-2 py-3">
			<Button
				type="submit"
				disabled={isSubmitting}
				className={cn(
					"w-full border border-border/70 bg-transparent px-3 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground shadow-none",
					isSubmitting && "cursor-not-allowed opacity-60",
				)}
				size="sm"
				variant="outline"
				data-testid="checkpoint-submit"
			>
				Create checkpoint
			</Button>
			<p className="px-1 text-xs leading-4 text-muted-foreground">
				Upvote issue{" "}
				<a
					className="text-primary underline-offset-4 hover:underline"
					href="https://github.com/opral/flashtype/issues/82"
					target="_blank"
					rel="noreferrer"
				>
					#82
				</a>{" "}
				for a commenting feature on checkpoints.
			</p>
		</form>
	);
}
