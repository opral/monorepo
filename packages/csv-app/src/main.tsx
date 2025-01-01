import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes } from "./routes.tsx";
import "@shoelace-style/shoelace/dist/themes/light.css";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";

setBasePath(
	"https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.16.0/cdn/"
);

const router = createBrowserRouter(
	routes.map((route) => ({
		...route,
		// Wrapping the route in a Suspense to avoid React Router
		// errors that "A component is async but wasn't wrapped in Suspense"
		// The error is irrelevant for the demo. A 1ms white screen is OK.
		element: <Suspense fallback={null}>{route.element}</Suspense>,
	})),
	{
		// in case the app is running one lix origin
		basename: window.location.pathname.startsWith("/app/csv")
			? "/app/csv"
			: undefined,
	}
);

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>
);
