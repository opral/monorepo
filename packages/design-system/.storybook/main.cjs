module.exports = {
	stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
	addons: ["@storybook/addon-links", "@storybook/addon-essentials"],
	framework: "@storybook/web-components",
	// hosting the tailwind.css stylesheet
	staticDirs: [{ from: "./static", to: "/" }],
};
