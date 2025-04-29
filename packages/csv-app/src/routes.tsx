import { RouteObject } from "react-router-dom";
import EditorPage from "./routes/editor/Page.tsx";
import IndexPage from "./routes/index/Page.tsx";
import ChangesPage from "./routes/changes/Page.tsx";
import ConflictsPage from "./routes/conflicts/Page.tsx";
import RootLayout from "./layouts/RootLayout.tsx";
import GraphPage from "./routes/graph/Page.tsx";

export const routes: RouteObject[] = [
	{
		path: "/",
		element: (
			<RootLayout>
				<IndexPage />
			</RootLayout>
		),
	},
	{
		path: "/editor",
		element: (
			<RootLayout>
				<EditorPage />
			</RootLayout>
		),
	},
	{
		path: "/changes",
		element: (
			// @ts-expect-error - type mismatch?
			<RootLayout>
				<ChangesPage />,
			</RootLayout>
		),
	},
	// {
	// 	path: "/conflicts",
	// 	element: (
	// 		// @ts-expect-error - type mismatch?
	// 		<RootLayout>
	// 			<ConflictsPage />,
	// 		</RootLayout>
	// 	),
	// },
	// {
	// 	path: "/graph",
	// 	element: (
	// 		// @ts-expect-error - type mismatch?
	// 		<RootLayout>
	// 			<GraphPage />,
	// 		</RootLayout>
	// 	),
	// },
];
