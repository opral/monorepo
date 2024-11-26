import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes } from "./routes.tsx";
import "@shoelace-style/shoelace/dist/themes/light.css";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";
import { App } from "./layouts/AppLayout.tsx";

setBasePath(
	"https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.16.0/cdn/"
);

const router = createBrowserRouter(
	routes.map((route) => ({
		...route,
		// Wrap each route's element with the App layout and Suspense
		element: (
			<Suspense fallback={null}>
				<App>{route.element} </App>
			</Suspense>
		),
	}))
);

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>
);
