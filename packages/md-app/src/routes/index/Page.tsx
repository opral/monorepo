import { Toaster } from 'sonner';
import { PlateEditor } from '@/components/editor/plate-editor';
import { activeFileAtom, intermediateChangesAtom } from '@/state-active-file';
import { useAtom } from 'jotai/react';
import FileName from '@/components/FileName';
import { useUrlChangeListener } from '@/hooks/useUrlChangeListener';
import {
	MultiSidebarProvider,
	useMultiSidebar
} from "@/components/ui/multisidebar";
import { LixSidebar } from "@/components/ui/sidebar-lix";
import { useEffect, useState } from "react";
import { Button } from '@/components/plate-ui/button';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import ChangeControlSidebar from '@/components/ui/sidebar-change-control';
import { activeAccountAtom } from '@/state';
import posthog from 'posthog-js';

// Wrapper component that has access to the MultiSidebar context
function PageContent() {
	const [activeFile] = useAtom(activeFileAtom);
	const [activeAccount] = useAtom(activeAccountAtom);
	const [intermediateChanges] = useAtom(intermediateChangesAtom);
	const { leftSidebar, rightSidebar } = useMultiSidebar();

	useEffect(() => {
		if (activeAccount && activeAccount.id) {
			posthog.identify(activeAccount.id, {
				LIX_USER_ID: activeAccount.id,
				LIX_USER_NAME: activeAccount.name,
			});
		}
	}, [activeAccount])

	// Control sidebar visibility using the context
	const toggleLeftSidebar = () => {
		leftSidebar.setOpen(!leftSidebar.open);
	};

	const toggleRightSidebar = () => {
		rightSidebar.setOpen(!rightSidebar.open);
	};

	return (
		<div className="flex items-stretch w-full h-screen">
			{/* Left sidebar - directly controlled with CSS */}
			<div className={`h-full overflow-hidden transition-all duration-200 ease-in-out bg-sidebar border-r flex flex-col ${leftSidebar.open ? 'w-[16rem]' : 'w-0'}`}>
				<LixSidebar />
			</div>

			{/* Center content */}
			<div className="flex-1 flex flex-col overflow-hidden bg-background">
				<div className="bg-slate-50 border-b-[1px] border-border p-2 flex items-center justify-between">
					<div className="flex items-center">
						<Button
							variant="ghost"
							size="icon"
							className="mr-2 size-7"
							onClick={toggleLeftSidebar}
						>
							{leftSidebar.open ? <PanelLeftClose /> : <PanelLeftOpen />}
							<span className="sr-only">Toggle Project Sidebar</span>
						</Button>
						<FileName />
					</div>
					<div className="flex items-center">
						<Button
							variant="ghost"
							size="icon"
							className="size-7 relative"
							onClick={toggleRightSidebar}
						>
							{intermediateChanges.length > 0 && !rightSidebar.open && (
								<>
									<span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-primary animate-ping" />
									<span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-primary" />
								</>
							)}
							{rightSidebar.open ? <PanelRightClose /> : <PanelRightOpen />}
							<span className="sr-only">Toggle Change Control Sidebar</span>
						</Button>
					</div>
				</div>
				{activeFile ?
					<div className="h-full flex-1 overflow-hidden" data-registry="plate">
						<PlateEditor />
						<Toaster />
					</div>
					: <div className="h-full flex-1 flex justify-center items-center">
						No file selected
					</div>}
			</div>

			{/* Right sidebar */}
			<div className={`h-full overflow-hidden transition-all duration-200 ease-in-out bg-sidebar border-l ${rightSidebar.open ? 'w-[20rem]' : 'w-0'}`}>
				<ChangeControlSidebar />
			</div>
		</div>
	);
}

export default function Page() {
	useUrlChangeListener();

	// Initialize sidebar states from localStorage with defaults
	const [leftOpen, setLeftOpen] = useState(() => {
		const savedValue = localStorage.getItem('flashtype:sidebar:left');
		return savedValue !== null ? savedValue === 'true' : false; // default to false if not set
	});

	const [rightOpen, setRightOpen] = useState(() => {
		const savedValue = localStorage.getItem('flashtype:sidebar:right');
		return savedValue !== null ? savedValue === 'true' : false; // default to false if not set
	});

	// Update localStorage when sidebar states change
	const handleLeftSidebarChange = (open: boolean) => {
		localStorage.setItem('flashtype:sidebar:left', String(open));
		setLeftOpen(open);
	};

	const handleRightSidebarChange = (open: boolean) => {
		localStorage.setItem('flashtype:sidebar:right', String(open));
		setRightOpen(open);
	};

	return (
		<div className="w-full h-full">
			<MultiSidebarProvider
				defaultLeftOpen={leftOpen}
				defaultRightOpen={rightOpen}
				leftOpen={leftOpen}
				rightOpen={rightOpen}
				onLeftOpenChange={handleLeftSidebarChange}
				onRightOpenChange={handleRightSidebarChange}
			>
				<PageContent />
			</MultiSidebarProvider>
		</div>
	);
}