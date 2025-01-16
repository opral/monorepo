export function alias(map: Record<string, string>) {
	return {
		name: "astro-plugin-paraglide-alias",
		resolveId(id: string) {
			return map[id];
		},
	};
}
