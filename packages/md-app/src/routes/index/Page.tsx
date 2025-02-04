import { lixAtom } from "@/state.ts";
import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import { Toaster } from 'sonner';
import { PlateEditor } from '@/components/editor/plate-editor';
import { SettingsProvider } from '@/components/editor/settings';

export default function Page() {
	// state atoms
	const [lix] = useAtom(lixAtom);

	//hooks
	const navigate = useNavigate();

	return (
		<div className="h-screen w-full" data-registry="plate">
			<SettingsProvider>
				<PlateEditor />
			</SettingsProvider>

			<Toaster />
		</div>
	);
}
