import { Toaster } from 'sonner';
import { PlateEditor } from '@/components/editor/plate-editor';
import { SettingsProvider } from '@/components/editor/settings';
import LixMenuDropdown from "@/components/LixMenuDropdown";
import { activeFileAtom, checkpointChangeSetsAtom, intermediateChangesAtom } from '@/state-active-file';
import { useAtom } from 'jotai/react';
import { Separator } from '@/components/plate-ui/separator';
import IntermediateCheckpointComponent from '@/components/IntermediateCheckpointComponent';
import CheckpointComponent from '@/components/CheckpointComponent';

export default function Page() {
	const [activeFile] = useAtom(activeFileAtom)
	const [intermediateChanges] = useAtom(intermediateChangesAtom);
	const [checkpointChangeSets] = useAtom(checkpointChangeSetsAtom);

	return (
		<>
			<div className="w-full bg-slate-50 border-b-[1px] border-border p-2 flex justify-between items-center">
				<div className="flex-1" />
				<LixMenuDropdown />
			</div>
			<div className='flex h-full'>
				{activeFile ?
					<div className="h-screen flex-1 max-w-[calc(100%-600px)]" data-registry="plate">
						<SettingsProvider>
							<PlateEditor />
						</SettingsProvider>
						<Toaster />
					</div>
					: <div className="h-screen flex-1 max-w-[calc(100%-600px)] flex justify-center items-center">
						No file selected
					</div>}
				<Separator orientation="vertical" className="h-full" />
				<div className="w-[600px] flex flex-col h-full relative mt-[10px]">
					{/* Fade effect at the top */}
					<div className="absolute top-0 left-0 w-full h-[20px] bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
					<div className="px-[10px] h-[calc(100%_-_60px)] overflow-y-auto">
						{intermediateChanges.length > 0 && (
							<IntermediateCheckpointComponent />
						)}
						{checkpointChangeSets.map((checkpointChangeSet, i) => {
							return (
								<CheckpointComponent
									key={checkpointChangeSet.id}
									checkpointChangeSet={checkpointChangeSet}
									showTopLine={i !== 0 || intermediateChanges.length > 0}
									showBottomLine={i !== checkpointChangeSets.length - 1}
								/>
							);
						})}
					</div>
				</div>
			</div>
		</>
	);
}
