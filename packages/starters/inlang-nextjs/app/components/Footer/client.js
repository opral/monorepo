'use client'

import { FooterBase } from './FooterBase'
import { useTranslation } from '../../i18n/client'

const Footer = ({ lng }) => {
  const { t } = useTranslation(lng, 'footer')
  return <FooterBase t={t} lng={lng} />
}

export default Footer