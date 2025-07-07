import { useCallback } from "react";
import {
	updateMdAstEntities,
	type MdAstEntity,
	selectMdAstRoot,
	selectMdAstNodes,
	selectActiveFile,
} from "@/queries";
import { useLix, useQueryTakeFirst } from "@lix-js/react-utils";
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

	// const mdRoot = useQueryTakeFirst(selectMdAstRoot);

	// const mdNodes = useQuery(selectMdAstNodes);

	const [state, setState] = useState({
		order: [],
		entities: [] as any,
		isLoading: true,
		error: null,
	});

	// const [mdRoot, setMdRoot] = useState();
	// const [mdNodes, setMdNodes] = useState();

	const activeFile = useQueryTakeFirst(selectActiveFile);

	// console.log("called hook");

	async function x() {
		const root = await selectMdAstRoot(lix).executeTakeFirst();

		const entities = await selectMdAstNodes(lix).execute();

		console.log("setting state", root, entities);

		setState({
			order: root?.snapshot_content?.order ?? [],
			entities: entities.map((v) => v.snapshot_content),
			isLoading: false,
			error: null,
		});
	}

	useEffect(() => {
		x();
	}, [lix]);

	// Update entities with optimistic updates
	const updateEntities = useCallback(
		async (entities: MdAstEntity[], order: string[]) => {
			console.log("updating state", order, entities);
			// console.log({ entities, order });

			try {
				await updateMdAstEntities(lix, activeFile ?? null, entities, order);
			} catch (error) {
				console.error("Failed to update MD-AST entities:", error);
			}
		},
		[lix]
	);

	return {
		state,
		updateEntities,
	};
}
