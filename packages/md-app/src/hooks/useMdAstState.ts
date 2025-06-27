import { useCallback, useEffect, useState } from 'react';
import { useQuery } from './useQuery';
import { selectLix, selectActiveFile, selectMdAstDocument, updateMdAstEntities, type MdAstEntity } from '@/queries';

export interface MdAstState {
	entities: MdAstEntity[];
	order: string[];
	isLoading: boolean;
	error: Error | null;
}

export interface UseMdAstStateReturn {
	state: MdAstState;
	updateEntities: (entities: MdAstEntity[], order: string[]) => Promise<void>;
	reload: () => void;
}

/**
 * Hook for managing MD-AST state with real-time sync to lix
 * Provides optimistic updates and conflict resolution
 */
export function useMdAstState(): UseMdAstStateReturn {
	const [lix] = useQuery(selectLix);
	const [activeFile] = useQuery(selectActiveFile);
	const [mdAstDocument] = useQuery(selectMdAstDocument);
	
	const [state, setState] = useState<MdAstState>({
		entities: [],
		order: [],
		isLoading: true,
		error: null,
	});

	// Track if we're in the middle of an optimistic update
	const [isOptimisticUpdate, setIsOptimisticUpdate] = useState(false);

	// Update state when MD-AST document changes (from lix)
	useEffect(() => {
		if (mdAstDocument && !isOptimisticUpdate) {
			setState({
				entities: mdAstDocument.entities,
				order: mdAstDocument.order,
				isLoading: false,
				error: null,
			});
		} else if (!mdAstDocument && activeFile) {
			setState({
				entities: [],
				order: [],
				isLoading: false,
				error: null,
			});
		}
	}, [mdAstDocument, activeFile, isOptimisticUpdate]);

	// Update entities with optimistic updates
	const updateEntities = useCallback(async (entities: MdAstEntity[], order: string[]) => {
		if (!activeFile || !lix) {
			console.warn('Cannot update entities: no active file or lix instance');
			return;
		}

		// Optimistic update - immediately update UI
		setIsOptimisticUpdate(true);
		setState(prevState => ({
			...prevState,
			entities,
			order,
			error: null,
		}));

		try {
			// Save to lix
			await updateMdAstEntities(entities, order);
			
			// Successful save - reset optimistic flag after a delay to allow query to update
			setTimeout(() => {
				setIsOptimisticUpdate(false);
			}, 100);

		} catch (error) {
			console.error('Failed to update MD-AST entities:', error);
			
			// Revert optimistic update on error
			setIsOptimisticUpdate(false);
			setState(prevState => ({
				...prevState,
				error: error instanceof Error ? error : new Error(String(error)),
			}));
		}
	}, [activeFile, lix]);

	// Reload entities from lix (useful for conflict resolution)
	const reload = useCallback(() => {
		setIsOptimisticUpdate(false);
		// This will trigger a re-query of selectMdAstDocument
		if (mdAstDocument) {
			setState({
				entities: mdAstDocument.entities,
				order: mdAstDocument.order,
				isLoading: false,
				error: null,
			});
		}
	}, [mdAstDocument]);

	return {
		state,
		updateEntities,
		reload,
	};
}

/**
 * Simplified hook that just returns the current MD-AST document state
 * Use this when you only need to read the current state without updating
 */
export function useMdAstDocument() {
	const [mdAstDocument] = useQuery(selectMdAstDocument);
	
	return mdAstDocument || { entities: [], order: [] };
}

/**
 * Hook for checking if MD-AST data is available for the current file
 */
export function useMdAstAvailability() {
	const [activeFile] = useQuery(selectActiveFile);
	const [mdAstDocument] = useQuery(selectMdAstDocument);
	
	return {
		hasActiveFile: !!activeFile,
		hasEntities: !!(mdAstDocument && mdAstDocument.entities.length > 0),
		isEmpty: !!(mdAstDocument && mdAstDocument.entities.length === 0),
		isLoading: !mdAstDocument && !!activeFile,
	};
}