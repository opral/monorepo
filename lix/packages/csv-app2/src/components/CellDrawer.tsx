import { SlDrawer } from "@shoelace-style/shoelace/dist/react";
import { SetStateAction, useAtom } from "jotai";
import React from "react";
import { editorSelectionAtom } from "../state.ts";

export const CellDrawer = (props: {
	showDrawer: boolean;
	setShowDrawer: React.Dispatch<SetStateAction<boolean>>;
}) => {
	const [selection] = useAtom(editorSelectionAtom);

	return (
		<SlDrawer
			open={props.showDrawer}
			contained
			onSlRequestClose={() => props.setShowDrawer(false)}
		>
			<pre>{JSON.stringify(selection, null, 2)}</pre>
		</SlDrawer>
	);
};
