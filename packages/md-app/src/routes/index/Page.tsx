import { Toaster } from 'sonner';
import { PlateEditor } from '@/components/editor/plate-editor';
import { activeFileAtom } from '@/state-active-file';
import { useAtom } from 'jotai/react';
import FileName from '@/components/FileName';
import { useUrlChangeListener } from '@/hooks/useUrlChangeListener';
import {
	MultiSidebarProvider,
	useMultiSidebar
} from "@/components/ui/multisidebar";
import { LixSidebar } from "@/components/ui/sidebar-lix";
import { useState } from "react";
import { Button } from '@/components/plate-ui/button';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import ChangeControlSidebar from '@/components/ui/sidebar-change-control';

// Wrapper component that has access to the MultiSidebar context
function PageContent() {
	const [activeFile] = useAtom(activeFileAtom);
	const { leftSidebar, rightSidebar } = useMultiSidebar();

	// Control sidebar visibility using the context
	const toggleLeftSidebar = () => {
		leftSidebar.setOpen(!leftSidebar.open);
	};

	const toggleRightSidebar = () => {
		rightSidebar.setOpen(!rightSidebar.open);
	};

	return (
		<div className="flex items-stretch w-full h-full">
			{/* Left sidebar - directly controlled with CSS */}
			<div className={`h-screen overflow-hidden transition-all duration-200 ease-in-out bg-sidebar border-r flex flex-col ${leftSidebar.open ? 'w-[14rem]' : 'w-0'}`}>
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
							className="size-7"
							onClick={toggleRightSidebar}
						>
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
			<div className={`h-screen overflow-hidden transition-all duration-200 ease-in-out bg-sidebar border-l ${rightSidebar.open ? 'w-[18rem]' : 'w-0'}`}>
				<ChangeControlSidebar />
			</div>
		</div>
	);
}

export default function Page() {
	useUrlChangeListener();
	const [leftOpen, setLeftOpen] = useState(true);
	const [rightOpen, setRightOpen] = useState(true);

	return (
		<div className="w-full h-full">
			{/* MultiSidebarProvider properly configured */}
			<MultiSidebarProvider
				defaultLeftOpen={leftOpen}
				defaultRightOpen={rightOpen}
				leftOpen={leftOpen}
				rightOpen={rightOpen}
				onLeftOpenChange={setLeftOpen}
				onRightOpenChange={setRightOpen}
			>
				<PageContent />
			</MultiSidebarProvider>
		</div>
	);
}