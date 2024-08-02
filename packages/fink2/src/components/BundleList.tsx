import { useAtom } from "jotai";
import { useEffect } from "react";
import { projectAtom } from "../state.ts";

const BundleList = () => {
	const [project] = useAtom(projectAtom);
	//const [currentListBundles, setCrurrentListBundles] = useState([]);

	useEffect(() => {
		project?.db
			.selectFrom("bundle")
			.select("id")
			.execute()
			.then((x: any) => {
				console.log(x);
			});
		//console.log(bundles);
		// bundleSelect
		// 	?.select((eb) => ["id", "alias"])
		// 	.execute()
		// 	.then((freshBundles: any) => {
		// 		setCrurrentListBundles(freshBundles);
		// 		console.log(freshBundles);
		// 	});

		// TODO SDK-v2 setup query that filters by active language, reported lints, bundle ids and searches text within the filtered variants
		// const intervalId = setInterval(() => {
		// 	populateMessages(project.bundle.select)
		// 		.execute()
		// 		.then((freshBundles: any) => {
		// 			setCrurrentListBundles(freshBundles)
		// 		})
		// }, 1000)
		// return () => clearInterval(intervalId)
	}, [project]);

	console.log("BundleList rerendered");
	return <div>{JSON.stringify(project?.settings.get())}</div>;
};

export default BundleList;
