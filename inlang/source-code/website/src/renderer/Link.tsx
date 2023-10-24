import { languageTag, sourceLanguageTag } from "@inlang/paraglide-js/inlang-marketplace"

const Link = (props: { href?: string; [key: string]: any }) => {
	const modifiedHref =
		languageTag() === sourceLanguageTag ? props.href : "/" + languageTag() + props.href

	return <a {...props} href={modifiedHref} />
}

export default Link
