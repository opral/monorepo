"use client"

import { FooterBase } from "./FooterBase"
import { t } from "i18next"

const Footer = ({ lng }) => {
	return <FooterBase t={t} lng={lng} />
}

export default Footer
