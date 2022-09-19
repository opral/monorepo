import { expect, it } from "vitest";
// vitest struggles with the none-compiled commonjs file. hence, import from dist.
import { forEachColorToken } from "../../../dist/components/utilities/forEachColorToken.cjs";

it("should work as expected", () => {
	const result = forEachColorToken(["primary", "secondary", "error"], {
		".button-${token}": {
			color: "theme(colors.${token})",
		},
	});
	const expectation = [
		{
			".button-primary": {
				color: "theme(colors.primary)",
			},
		},
		{
			".button-secondary": {
				color: "theme(colors.secondary)",
			},
		},
		{
			".button-error": {
				color: "theme(colors.error)",
			},
		},
	];
	expect(result).toEqual(expectation);
});
