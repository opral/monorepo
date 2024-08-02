import Layout from "../../layout.tsx";
import { projectAtom } from "../../state.ts";
import { useAtom } from "jotai";
import { MessageBundle } from "../../components/InlangBundle.tsx";
import { pluralBundle } from "@inlang/sdk2";
import { insertNestedBundle } from "../../helper/insertNestedBundle.ts";
import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { useEffect, useState } from "react";

export default function App() {
	const [project] = useAtom(projectAtom);
	const [bundleIds, setBundleIds] = useState<string[]>([]);
	const getBundleIds = async () => {
		const bundleIdsList = await project?.db.selectFrom("bundle").selectAll().execute() ?? [];
		setBundleIds(bundleIdsList.map((bundle) => bundle.id));
		console.log(bundleIdsList);
		return bundleIdsList;
	}
	// const getBundleById = async (bundleId: string) => {
	// 	await project?.db.selectFrom("bundle").where("id", "=", bundleId).execute()
	// }

	useEffect(() => {
		getBundleIds();
		// setup demo if project is empty
		if (bundleIds.length === 0) {
			console.info("Insert demo bundle in empty project");
			insertNestedBundle(project, pluralBundle)
			getBundleIds();
		}
	}, [project])

	return (
		<>
			<Layout>
				<SlButton onClick={getBundleIds}>Get Bundle IDs</SlButton>
				{project &&
					<MessageBundle
					bundle={pluralBundle}
					settings={project.settings.get()}
				/>
				}
				{/* {project &&
					bundleIds.map((bundleId) => (
						<MessageBundle
							key={bundleId}
							bundle={getBundleById}
							settings={project.settings.get()}
						/>
					))
				} */}
			</Layout>
		</>
	);
}
