import Layout from "../../layout.tsx";
import { projectAtom, selectedProjectPathAtom } from "../../state.ts";
import { useAtom } from "jotai";
import InlangBundle from "../../components/InlangBundle.tsx";
import { useEffect, useState } from "react";

export default function App() {
	const [project] = useAtom(projectAtom);
	const [selectedProjectPath] = useAtom(selectedProjectPathAtom);

	const [bundleIds, setBundleIds] = useState<string[]>([]);
	const getBundleIds = async () => {
		const bundleIdsList =
			(await project?.db.selectFrom("bundle").selectAll().execute()) ?? [];
		setBundleIds(bundleIdsList.map((bundle) => bundle.id));
		return bundleIdsList;
	};

	useEffect(() => {
		if (!project) return;
		getBundleIds();
		setInterval(async () => {
			getBundleIds();
		}, 2000);
	}, [project]);

	useEffect(() => {
		if (!project) return;
		if (!selectedProjectPath) return;
		setInterval(async () => {
			const opfsRoot = await navigator.storage.getDirectory();
			const fileHandle = await opfsRoot.getFileHandle(selectedProjectPath);
			const writable = await fileHandle.createWritable();
			const file = await project.toBlob();
			await writable.write(file);
			await writable.close();
		}, 2000);
	}, [selectedProjectPath, project]);

	return (
		<>
			<Layout>
				{project &&
					bundleIds.map((bundleId) => (
						<InlangBundle key={bundleId} bundleId={bundleId} />
					))}
				{(!project || !selectedProjectPath) && <>No project selected</>}
				{project && selectedProjectPath && bundleIds.length === 0 && (
					<>No bundles found, please import demo ...</>
				)}
			</Layout>
		</>
	);
}
