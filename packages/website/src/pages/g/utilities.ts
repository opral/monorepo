import type { MarketplaceManifest } from "@inlang/marketplace-manifest";

/**
 * Converts a camelCase string to Title Case
 */
export const typeOfIdToTitle = (id: MarketplaceManifest["id"]) => {
	const type = id.slice(0, id.indexOf("."));
	return type.includes("message")
		? "Message Lint Rule"
		: type.charAt(0).toUpperCase() + type.slice(1);
};

/**
 * Determines the color for a marketplace id.
 */
export const colorForTypeOf = (id: MarketplaceManifest["id"]) => {
	if (id.startsWith("app.")) {
		return "#3B82F6";
	} else if (id.startsWith("library.")) {
		return "#e35473";
	} else if (id.startsWith("plugin.")) {
		return "#BF7CE4";
	} else {
		return "#06B6D4";
	}
};

/**
 * Conerts a CDN link to a github link. Only works for jsdelivr links at the moment.
 */
export const convertLinkToGithub = (link: string) => {
	if (link.includes("https://cdn.jsdelivr.net")) {
		const parts = link.split("/");

		const path = parts.slice(6).join("/");
		const user = parts[4];
		const repo = parts[5]?.slice(0, parts[5].indexOf("@"));
		const branch =
			parts[5]?.slice(parts[5].indexOf("@") + 1) === "latest"
				? "main"
				: parts[5]?.slice(parts[5].indexOf("@") + 1);

		const githubLink = `https://github.com/${user}/${repo}/tree/${branch}/${path}`;
		return githubLink;
	} else if (link.includes("raw.githubusercontent.com")) {
		return link
			.replace("raw.githubusercontent.com", "github.com")
			.replace("refs/heads", "blob");
	} else {
		return "https://github.com/opral/inlang";
	}
};
