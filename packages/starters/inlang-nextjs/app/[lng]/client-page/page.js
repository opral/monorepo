'use client'

import Link from 'next/link'
import { useTranslation } from '../../i18n/client'
import Footer from '../../components/footer/client'
import { useState } from 'react'

export default function Page({ params: { lng } }) {
  const { t } = useTranslation(lng, 'client-page')
  const [counter, setCounter] = useState(0)
  return (
    <>
      <h1>{t('title')}</h1>
      <p>{t('counter', { count: counter })}</p>
      <div className="p-2 space-x-2">
        <button className="px-2 bg-slate-100 text-black" onClick={() => setCounter(Math.max(0, counter - 1))}>-</button>
        <button className="px-2 bg-slate-100 text-black" onClick={() => setCounter(Math.min(10, counter + 1))}>+</button>
      </div>
      <Link href={`/${lng}`}>
        <button type="button">
          {t('back-to-home')}
        </button>
      </Link>
      <Footer lng={lng} />
    </>
  )
}