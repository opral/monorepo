import Link from "next/link"
import Footer from "../components/Footer"
import { t } from "i18next"

export default async function Page({ params: { lng } }) {
	return (
		<>
			<h1>{t("translation:title")}</h1>
			<Link href={`/${lng}/second-page`}>{t("translation:to-second-page")}</Link>
			<Link href={`/${lng}/second-page`}>Translate me</Link>
			<br />
			<Link href={`/${lng}/client-page`}>{t("translation:to-client-page")}</Link>
			<Link href={`/${lng}/client-page`}>{t("translation:missingReference")}</Link>
			<Link href={`/${lng}/client-page`}>{t("translation:missingReference")}</Link>
			<Footer lng={lng} />
		</>
	)
}
