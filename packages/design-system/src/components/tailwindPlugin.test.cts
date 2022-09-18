import { expect, test } from "vitest";
import { usedUtilityClasses } from "../../dist/components/tailwindPlugin.cjs";
import fs from "node:fs";

/**
 * Importing CommonTS with Vitest is not possible. Hence, the function imports
 * the compiled function from dist. Make sure that changes have been compiled.
 * !Otherwise, you will wonder why the test is behaving weirdly.
 */

test("identitifying tailwind css classes", () => {
	return test.skip("vitest struggles to import commonjs file");
	// tailwind css classes use backslashes for escaping.
	// @ts-ignore
	fs.readFileSync = () => {
		return mockCssFile;
	};
	const result = usedUtilityClasses();
	expect(Object.keys(result)).toContain(
		// prettier-ignore
		// the escapes are important
		[
		".mr-2",
		".mb-2",
		".rounded",
		".px-5",
		".py-2\.5",
		".py-2",
		".hover\:bg-hover-primary",
		".focus\:outline-none",
		".focus\:ring-4"
	]
	);
	return true;
});

const mockCssFile =
	// prettier-ignore
	`
.mr-2 {
	margin-right: 0.5rem;
  }
  
  .mb-2 {
	margin-bottom: 0.5rem;
  }
  
  .rounded {
	border-radius: 0.25rem;
  }
  
  .px-5 {
	padding-left: 1.25rem;
	padding-right: 1.25rem;
  }
  
  .py-2\.5 {
	padding-top: 0.625rem;
	padding-bottom: 0.625rem;
  }
  
  .py-2 {
	padding-top: 0.5rem;
	padding-bottom: 0.5rem;
  }
  
  .hover\:bg-hover-primary:hover {
	background-color: #1350d4ff;
  }
  
  .focus\:outline-none:focus {
	outline: 2px solid transparent;
	outline-offset: 2px;
  }
  
  .focus\:ring-4:focus {
	--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
	--tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(4px + var(--tw-ring-offset-width)) var(--tw-ring-color);
	box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
  }
`;
