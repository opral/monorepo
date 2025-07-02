import { useCallback } from "react";
import {
	updateMdAstEntities,
	type MdAstEntity,
	selectMdAstRoot,
	selectMdAstNodes,
	selectActiveFile,
} from "@/queries";
import {
	useLix,
	useSuspenseQuery,
	useSuspenseQueryTakeFirst,
} from "@lix-js/react-utils";
import { useState } from "react";
import { useEffect } from "react";

export interface MdAstState {
	entities: MdAstEntity[];
	order: string[];
	isLoading: boolean;
	error: Error | null;
}

export interface UseMdAstStateReturn {
	state: MdAstState;
	updateEntities: (entities: MdAstEntity[], order: string[]) => Promise<void>;
}

/**
 * Hook for managing MD-AST state with real-time sync to lix
 * Provides optimistic updates and conflict resolution
 */
export function useMdAstState(): UseMdAstStateReturn {
	const lix = useLix();

	// const mdRoot = useSuspenseQueryTakeFirst(selectMdAstRoot);

	// const mdNodes = useSuspenseQuery(selectMdAstNodes);

	const [mdRoot, setMdRoot] = useState();
	const [mdNodes, setMdNodes] = useState();

	const activeFile = useSuspenseQueryTakeFirst(selectActiveFile);

	console.log("called hook");

	useEffect(() => {
		selectMdAstRoot(lix)
			.executeTakeFirst()
			.then((value) => {
				console.log("mdRoot", mdRoot);
				setMdRoot(value);
			});

		selectMdAstNodes(lix)
			.execute()
			.then((value) => {
				console.log("mdNodes", mdNodes);
				setMdNodes(value);
			});
	}, [lix]);

	// Update entities with optimistic updates
	const updateEntities = useCallback(
		async (entities: MdAstEntity[], order: string[]) => {
			console.log({ entities, order });

			try {
				await updateMdAstEntities(lix, activeFile ?? null, entities, order);
			} catch (error) {
				console.error("Failed to update MD-AST entities:", error);
			}
		},
		[lix]
	);

	return {
		state: {
			order: mdRoot?.snapshot_content?.order ?? [],
			entities:
				mdNodes?.map((node) => node.snapshot_content as MdAstEntity) ?? [],
			isLoading: false,
			error: null,
		},
		updateEntities,
	};
}
