import { Toaster } from 'sonner';
import { PlateEditor } from '@/components/editor/plate-editor';
import { SettingsProvider } from '@/components/editor/settings';
import LixMenuDropdown from "@/components/LixMenuDropdown";
import { activeFileAtom } from '@/state-active-file';
import { useAtom } from 'jotai/react';

export default function Page() {
	const [activeFile] = useAtom(activeFileAtom)
	return (
		<>
			<div className="w-full p-2 flex justify-between items-center">
				<div className="flex-1" />
				<LixMenuDropdown />
			</div>
			<div className="w-full border-t-[1px] border-[hsl(var(--border))]"></div>
			{activeFile &&
				<div className="h-screen w-full" data-registry="plate">
					<SettingsProvider>
						<PlateEditor />
					</SettingsProvider>
					<Toaster />
				</div>
			}
		</>
	);
}
