import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes } from "./routes.tsx";
import { App } from "./layouts/AppLayout.tsx";

const router = createBrowserRouter(
	routes.map((route) => ({
		...route,
		// Wrap each route's element with the App layout and Suspense
		element: (
			<Suspense fallback={null}>
				<App>{route.element} </App>
			</Suspense>
		),
	})),
	{
		// in case the app is running one lix origin
		basename: window.location.pathname.startsWith("/app/fm")
			? "/app/fm"
			: undefined,
	}
);

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>
);
