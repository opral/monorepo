import React from "react"
import ReactDOM from "react-dom/client"
import "./style.css"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { routes } from "./routes.tsx"

const router = createBrowserRouter(routes)

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		{/* @ts-expect-error - type mismatch somehwere */}
		<RouterProvider router={router} />
	</React.StrictMode>
)
