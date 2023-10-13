import { CategoryPage, type PageProps } from "../Category.jsx"

export function Page(props: PageProps) {
	return <CategoryPage slug={props.slug} content={props.content} />
}
