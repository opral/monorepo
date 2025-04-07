import { type RouteObject } from "react-router";
import Index from "./index.tsx";
import About from "./about/index.tsx";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/about",
    element: <About />,
  },
];
