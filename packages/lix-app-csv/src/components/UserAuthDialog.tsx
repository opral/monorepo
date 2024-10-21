/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	SlButton,
	SlDialog,
	SlInput,
} from "@shoelace-style/shoelace/dist/react";
// import { useAtom } from "jotai";
import { useState } from "react";
// import { authorNameAtom } from "../state.ts";

export const UserAuthDialog = (props: {
	showAuthorDialog: boolean;
	setShowAuthorDialog: (value: boolean) => void;
}) => {
	const [author, setAuthor] = useState("");
	// const [, setAuthorName] = useAtom(authorNameAtom);

	const handleSetAuthor = async () => {
		// setAuthorName(author);
		props.setShowAuthorDialog(false);
	};

	return (
		<SlDialog
			open={props.showAuthorDialog}
			onSlRequestClose={() => props.setShowAuthorDialog(false)}
			noHeader
		>
			<h2 className="text-lg font-medium pb-2">Set author information</h2>
			<p className="text-sm leading-[1.5]! max-w-[400px] pb-4 text-zinc-500">
				Your author name is appended to your changes and is visible in the
				project history.
			</p>
			<img
				src="/auth-dialog-image.png"
				alt="set author image"
				className="rounded-lg pb-8"
			/>
			<SlInput
				label="Username"
				placeholder="Max Mustermann"
				onInput={(e: any) => setAuthor(e.target.value)}
			></SlInput>
			<SlButton
				variant="primary"
				slot="footer"
				onClick={handleSetAuthor}
				className="w-full"
			>
				Save
			</SlButton>
		</SlDialog>
	);
};
