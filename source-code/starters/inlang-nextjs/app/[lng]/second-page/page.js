import Link from 'next/link'
import Footer from '../../components/footer'
import { t } from 'i18next'

export default async function Page({ params: { lng } }) {
  return (
    <>
      <h1>{t('second-page:title')}</h1>
      <Link href={`/${lng}`}>
        {t('second-page:back-to-home')}
      </Link>
      <Footer lng={lng}/>
    </>
  )
}