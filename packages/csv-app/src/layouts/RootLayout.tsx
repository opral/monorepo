import { useAtom } from "jotai";
import { LIX_FILE_NAME, lixAtom, withPollingAtom } from "../state.ts";
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

	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (file) {
			// Handle the file here
			const fileContent = await file.arrayBuffer();

			const opfsRoot = await navigator.storage.getDirectory();
			const opfsFile = await opfsRoot.getFileHandle(LIX_FILE_NAME, {
				create: true,
			});
			const writable = await opfsFile.createWritable();
			await writable.write(fileContent);
			await writable.close();
			window.location.reload();
		}
	};

	return (
		<>
			{/* Header with socials */}
			<div className="w-full border-b border-zinc-200 bg-white flex items-center justify-between px-4 min-h-[54px] gap-2">
				<div className="flex gap-2 items-center">
					{/* <a href="https://lix.opral.com" target="_blank"> */}
					<img src="/lix.svg" alt="logo" className="w-8 h-8" />
					{/* </a> */}
					<h1 className="font-medium">CSV Demo</h1>
					<SlDropdown>
						<SlButton slot="trigger" caret size="small">
							Options
						</SlButton>
						<SlMenu>
							<SlMenuItem
								onClick={() => document.getElementById("file-input")?.click()}
							>
								<SlIcon
									name="file-earmark"
									slot="prefix"
									className="mr-2"
								></SlIcon>
								Open
								<input
									id="file-input"
									type="file"
									style={{ display: "none" }}
									onChange={handleFileSelect}
								></input>
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
								onClick={async () => {
									// @ts-expect-error - globally defined
									await window.deleteLix();
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
