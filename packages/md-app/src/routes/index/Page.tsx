import { Toaster } from 'sonner';
import { PlateEditor } from '@/components/editor/plate-editor';
// import { SettingsProvider } from '@/components/editor/settings';
import { activeFileAtom, checkpointChangeSetsAtom, intermediateChangesAtom } from '@/state-active-file';
import { useAtom } from 'jotai/react';
import { Separator } from '@/components/plate-ui/separator';
import IntermediateCheckpointComponent from '@/components/IntermediateCheckpointComponent';
import CheckpointComponent from '@/components/CheckpointComponent';
import FileName from '@/components/FileName';
import { useMemo } from 'react';
import { isEqual } from "lodash-es";
import { useUrlChangeListener } from '@/hooks/useUrlChangeListener';
import {
	SidebarProvider,
	Sidebar,
	SidebarTrigger,
	SidebarInset,
	useSidebar
} from "@/components/ui/sidebar";
import { LixSidebar } from "@/components/ui/sidebar-lix";
import { Button } from '@/components/plate-ui/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const SidebarToggleButton = () => {
	const { open, setOpen } = useSidebar();

	return (
		<Button
			variant="ghost"
			size="icon"
			className="fixed z-50 left-4 bottom-4 shadow-md bg-background border border-border"
			onClick={() => setOpen(!open)}
			title={open ? "Hide sidebar" : "Show sidebar"}
		>
			{open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
		</Button>
	);
};

export default function Page() {
	useUrlChangeListener();
	const [activeFile] = useAtom(activeFileAtom)
	const [intermediateChanges] = useAtom(intermediateChangesAtom);
	const [checkpointChangeSets] = useAtom(checkpointChangeSetsAtom);

	// Filter out changes where before and after content are identical (ghost changes)
	const filteredChanges = useMemo(() => {
		return intermediateChanges.filter(change => {
			// Only show changes where the content has actually changed
			return !isEqual(change.snapshot_content_before, change.snapshot_content_after);
		});
	}, [intermediateChanges, activeFile]);

	return (
		<SidebarProvider>
			<div className="w-full h-full flex">
				<Sidebar side="left" variant="sidebar" collapsible="offcanvas">
					<LixSidebar />
				</Sidebar>
				<SidebarInset className="flex flex-col overflow-hidden">
					<div className="w-full bg-slate-50 border-b-[1px] border-border p-2 flex items-center">
						<div className="flex items-center">
							<SidebarTrigger className="mr-2" />
							<FileName />
						</div>
					</div>
					<div className='flex-1 flex overflow-hidden'>
						{activeFile ?
							<div className="h-full flex-1 max-w-[calc(100%-600px)]" data-registry="plate">
								<PlateEditor />
								<Toaster />
							</div>
							: <div className="h-full flex-1 max-w-[calc(100%-600px)] flex justify-center items-center">
								No file selected
							</div>}
						<Separator orientation="vertical" />
						<div className="h-full w-[600px] flex flex-col relative">
							<div className="px-[10px] pt-[10px] overflow-y-auto">
								{filteredChanges.length > 0 && (
									<IntermediateCheckpointComponent filteredChanges={filteredChanges} />
								)}
								{checkpointChangeSets.map((checkpointChangeSet, i) => {
									return (
										<CheckpointComponent
											key={checkpointChangeSet.id}
											checkpointChangeSet={checkpointChangeSet}
											showTopLine={i !== 0 || filteredChanges.length > 0}
											showBottomLine={i !== checkpointChangeSets.length - 1}
										/>
									);
								})}
							</div>
						</div>
					</div>
				</SidebarInset>

				{/* Floating toggle button - shows on both mobile and desktop */}
				{/* <SidebarToggleButton /> */}
			</div>
		</SidebarProvider>
	);
}
