/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAtom } from "jotai";
import {
	authorNameAtom,
	projectAtom,
	selectedProjectPathAtom,
	withPollingAtom,
} from "./state.ts";
import { useEffect, useState } from "react";
import SubNavigation from "./components/SubNavigation.tsx";
import Footer from "./components/Footer.tsx";
import MenuBar from "./components/layout/MenuBar.tsx";
import UserAuthDialog from "./components/layout/UserAuthDialog.tsx";

export default function Layout(props: { children: React.ReactNode }) {
	const [, setWithPolling] = useAtom(withPollingAtom);
	useEffect(() => {
		const interval = setInterval(() => {
			setWithPolling(Date.now());
			// put it down to 500 ms to show seamless loading
		}, 500);
		return () => clearInterval(interval);
	});

	const [authorName] = useAtom(authorNameAtom);
	const [project] = useAtom(projectAtom);
	const [selectedProjectPath] = useAtom(selectedProjectPathAtom);
	const [showAuthorDialog, setShowAuthorDialog] = useState(false);

	useEffect(() => {
		if (selectedProjectPath && !authorName) {
			setShowAuthorDialog(true);
		}
	}, [authorName, project?.lix.currentAuthor, selectedProjectPath]);

	useEffect(() => {
		if (authorName && project?.lix.currentAuthor.get() !== authorName) {
			project?.lix.currentAuthor.set(authorName);
		}
	}, [authorName, project?.lix.currentAuthor]);

	return (
		<>
			<div className="w-full min-h-screen bg-zinc-50">
				<div className="bg-white border-b border-zinc-200">
					<Grid>
						<MenuBar />
						<SubNavigation />
					</Grid>
				</div>
				{props.children}
				<UserAuthDialog
					showAuthorDialog={showAuthorDialog}
					setShowAuthorDialog={setShowAuthorDialog}
				/>
			</div>
			<Footer />
		</>
	);
}

export const Grid = (props: { children: React.ReactNode }) => {
	return <div className="max-w-7xl mx-auto px-4">{props.children}</div>;
};