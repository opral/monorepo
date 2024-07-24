import { kebabCase } from "lodash-es"

/**
 * Escapes the page ID and converts it to kebab case.
 *
 * @example
 *   kebabCasePageId("src/pages/MyPage.tsx") // "page-my-page"
 *   kebabCasePageId("src/pages/MyPage/index.tsx") // "page-my-page"
 */
export function kebabCasePageId(pageId: string) {
	return kebabCase("page-" + pageId.replace("src/pages", "")) as string
}
