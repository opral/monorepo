import {
	type RouteConfig,
	index,
	prefix,
	route,
} from "@react-router/dev/routes";

export default [
	// prefixing each path with an optional :locale
	// optional to match a path with no locale `/page`
	// or with a locale `/en/page`
	//
	// * make sure that the pattern you define here matches
	// * with the urlPatterns of paraglide JS if you use
	// * the `url` strategy
	...prefix(":locale?", [
		index("routes/home.tsx"),
		route("about", "routes/about.tsx"),
	]),
] satisfies RouteConfig;
