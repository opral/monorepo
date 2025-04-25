import { useAtom } from "jotai";
import { Textarea } from "./ui/textarea.tsx";
import { Form, FormControl, FormField, FormItem } from "./ui/form.tsx";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button.tsx";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar.tsx";
import {
	activeAccountAtom,
	activeVersionAtom,
	threadSearchParamsAtom,
	lixAtom,
} from "@/state.ts";
import IconArrow from "./icons/IconArrow.tsx";
import { createComment } from "@lix-js/sdk";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs.ts";

const ChatInput = () => {
	const [activeAccount] = useAtom(activeAccountAtom);
	const [threadSearchParams] = useAtom(threadSearchParamsAtom);
	const [activeVersion] = useAtom(activeVersionAtom);
	const [lix] = useAtom(lixAtom);

	const form = useForm({
		defaultValues: {
			comment: "",
		},
	});
	const {
		handleSubmit,
		watch,
		formState: { isValid },
	} = form;
	const commentValue = watch("comment");

	const handleTextareaChange = (
		event: React.ChangeEvent<HTMLTextAreaElement>
	) => {
		event.target.style.height = "auto";
		event.target.style.height = `${event.target.scrollHeight}px`;
	};

	const handleAddComment = async () => {
		// await lix.db.transaction().execute(async (trx) => {
		// 	const parentComment = await trx
		// 		.selectFrom("thread_comment")
		// 		.where("thread_comment.thread_id", "=", threadSearchParams)
		// 		.innerJoin("change", (join) =>
		// 			join
		// 				.onRef("change.entity_id", "=", "comment.id")
		// 				.on("change.schema_key", "=", "lix_comment_table")
		// 		)
		// 		.leftJoin("version_change", "version_change.change_id", "change.id")
		// 		.where((eb) => eb.or([
		// 			eb("version_change.version_id", "=", activeVersion!.id),
		// 			eb("version_change.change_id", "is", null)
		// 		]))
		// 		.orderBy("created_at", "desc")
		// 		.selectAll("comment")
		// 		.executeTakeFirstOrThrow();

		// 	return await createComment({
		// 		lix: { ...lix, db: trx },
		// 		parentComment,
		// 		content: commentValue,
		// 	});
		// });
		await saveLixToOpfs({ lix });
		form.reset();
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			handleSubmit(handleAddComment)();
		}
	};

	return (
		<div className="flex items-end justify-between gap-1.5 px-2.5 py-5 border-t border-slate-100">
			<Avatar className="w-8 h-8 mb-1 cursor-pointer hover:opacity-90 transition-opacity">
				<AvatarImage src="#" alt="#" />
				<AvatarFallback className="bg-[#fff] text-[#141A21] border border-[#DBDFE7]">
					{activeAccount?.name
						? activeAccount.name.substring(0, 2).toUpperCase()
						: "XX"}
				</AvatarFallback>
			</Avatar>
			<Form {...form}>
				<form
					onSubmit={handleSubmit(handleAddComment)}
					className="flex flex-1 items-center ring-1 ring-slate-100 rounded-md pl-3 pr-1 py-0.5 bg-slate-50"
				>
					<FormField
						control={form.control}
						name="comment"
						rules={{ required: "Comment content is required" }}
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormControl>
									<Textarea
										{...field}
										rows={1}
										placeholder="Add a comment ..."
										className="flex-1 border-none resize-none overflow-hidden shadow-none px-0 pt-2 focus-visible:ring-0"
										onInput={handleTextareaChange}
										onKeyDown={handleKeyDown}
										style={{ minHeight: "24px", fontSize: "1rem" }}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
					<Button
						type="submit"
						disabled={!isValid || commentValue === ""}
						size="sm"
						variant="ghost"
						className="px-1 mt-auto mb-1"
					>
						<IconArrow />
					</Button>
				</form>
			</Form>
		</div>
	);
};

export default ChatInput;