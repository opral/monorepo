// importing css stylesheet for the components
// see https://storybook.js.org/docs/react/configure/styling-and-css
import "../dist/components/style.css";

export const parameters = {
	actions: { argTypesRegex: "^on[A-Z].*" },
	controls: {
		matchers: {
			color: /(background|color)$/i,
			date: /Date$/,
		},
	},
};
