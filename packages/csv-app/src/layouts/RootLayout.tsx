import { useAtom } from "jotai";
import { lixAtom, withPollingAtom } from "../state.ts";
import { useEffect } from "react";
import {
	SlButton,
	SlDropdown,
	SlIcon,
	SlMenu,
	SlMenuItem,
} from "@shoelace-style/shoelace/dist/react";
import { Lix } from "@lix-js/sdk";

export default function RootLayout(props: { children: JSX.Element }) {
	const [, setPolling] = useAtom(withPollingAtom);
	const [lix] = useAtom(lixAtom);

	useEffect(() => {
		const interval = setInterval(() => {
			setPolling(Date.now());
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<>
			{/* Header with socials */}
			<div className="w-full border-b border-zinc-200 bg-white flex items-center justify-between px-4 min-h-[54px] gap-2">
				<div className="flex gap-2 items-center">
					<a href="https://lix.opral.com" target="_blank">
						<img src="/lix.svg" alt="logo" className="w-8 h-8" />
					</a>
					<h1 className="font-medium">CSV Demo</h1>
					<SlDropdown>
						<SlButton slot="trigger" caret size="small">
							Options
						</SlButton>
						<SlMenu>
							<SlMenuItem>
								<SlIcon
									name="file-earmark"
									slot="prefix"
									className="mr-2"
								></SlIcon>
								Open
							</SlMenuItem>
							<SlMenuItem onClick={() => handleExportLixFile(lix)}>
								<SlIcon
									name="file-arrow-down"
									slot="prefix"
									className="mr-2"
								></SlIcon>
								Export
							</SlMenuItem>
							<SlMenuItem
								onClick={() => {
									// @ts-expect-error - globally defined
									window.deleteLix();
									window.location.reload();
								}}
							>
								<SlIcon
									name="arrow-counterclockwise"
									slot="prefix"
									className="mr-2"
								></SlIcon>
								Reset
							</SlMenuItem>
						</SlMenu>
					</SlDropdown>
				</div>
				<div className="flex gap-3 items-center">
					<a href="https://discord.gg/gdMPPWy57R" target="_blank">
						<img src="/discord-icon.svg" alt="logo" className="w-6 h-6" />
					</a>
					<a href="https://x.com/lixCCS" target="_blank">
						<img src="/x-icon.svg" alt="logo" className="w-5 h-5" />
					</a>
					<a href="https://github.com/opral/monorepo" target="_blank">
						<img src="/github-icon.svg" alt="logo" className="w-5 h-5" />
					</a>
				</div>
			</div>
			{props.children}
		</>
	);
}

const handleExportLixFile = async (lix: Lix) => {
	const blob = await lix.toBlob();
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = "demo.lix";
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
};