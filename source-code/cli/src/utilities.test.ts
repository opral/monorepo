import type { Resource } from "@inlang/core/ast"
import { describe, expect, it } from "vitest"
import { countMessagesPerLanguage, getFlag } from "./utilities.js"

describe("countMessagesPerLanguage", () => {
	it("should return an empty object for an empty resource array", () => {
		const resource: Resource[] = []
		const result = countMessagesPerLanguage(resource)
		expect(result).toEqual({})
	})

	it("should count the number of messages per language", () => {
		const resource: Resource[] = [
			{
				type: "Resource",
				languageTag: { type: "LanguageTag", name: "en-US" },
				body: [
					{
						type: "Message",
						id: {
							type: "Identifier",
							name: "message1",
						},
						pattern: {
							type: "Pattern",
							elements: [
								{
									type: "Text",
									value: "Message 1",
								},
							],
						},
					},
					{
						type: "Message",
						id: {
							type: "Identifier",
							name: "message2",
						},
						pattern: {
							type: "Pattern",
							elements: [
								{
									type: "Text",
									value: "Message 2",
								},
							],
						},
					},
				],
			},
			{
				type: "Resource",
				languageTag: { type: "LanguageTag", name: "es-ES" },
				body: [
					{
						type: "Message",
						id: {
							type: "Identifier",
							name: "message1",
						},
						pattern: {
							type: "Pattern",
							elements: [
								{
									type: "Text",
									value: "Message 1",
								},
							],
						},
					},
				],
			},
			{
				type: "Resource",
				languageTag: { type: "LanguageTag", name: "fr-FR" },
				body: [
					{
						type: "Message",
						id: {
							type: "Identifier",
							name: "message1",
						},
						pattern: {
							type: "Pattern",
							elements: [
								{
									type: "Text",
									value: "Message 1",
								},
							],
						},
					},
				],
			},
			{
				type: "Resource",
				languageTag: { type: "LanguageTag", name: "en-US" },
				body: [
					{
						type: "Message",
						id: {
							type: "Identifier",
							name: "message3",
						},
						pattern: {
							type: "Pattern",
							elements: [
								{
									type: "Text",
									value: "Message 3",
								},
							],
						},
					},
				],
			},
		]
		const result = countMessagesPerLanguage(resource)
		expect(result).toEqual({
			"en-US": 3,
			"es-ES": 1,
			"fr-FR": 1,
		})
	})
})

describe("getFlag", () => {
	it("should return the correct emoji flag for a country code", () => {
		expect(getFlag("AD")).toEqual("🇦🇩")
		expect(getFlag("AE")).toEqual("🇦🇪")
		expect(getFlag("AF")).toEqual("🇦🇫")
		expect(getFlag("AG")).toEqual("🇦🇬")
		expect(getFlag("AI")).toEqual("🇦🇮")
		expect(getFlag("AL")).toEqual("🇦🇱")
		expect(getFlag("AM")).toEqual("🇦🇲")
		expect(getFlag("AO")).toEqual("🇦🇴")
		expect(getFlag("AQ")).toEqual("🇦🇶")
		expect(getFlag("AR")).toEqual("🇦🇷")
		expect(getFlag("AS")).toEqual("🇦🇸")
		expect(getFlag("AT")).toEqual("🇦🇹")
		expect(getFlag("AU")).toEqual("🇦🇺")
		expect(getFlag("AW")).toEqual("🇦🇼")
		expect(getFlag("AX")).toEqual("🇦🇽")
		expect(getFlag("AZ")).toEqual("🇦🇿")
		expect(getFlag("BA")).toEqual("🇧🇦")
		expect(getFlag("BB")).toEqual("🇧🇧")
		expect(getFlag("BD")).toEqual("🇧🇩")
		expect(getFlag("BE")).toEqual("🇧🇪")
		expect(getFlag("BF")).toEqual("🇧🇫")
		expect(getFlag("BG")).toEqual("🇧🇬")
		expect(getFlag("BH")).toEqual("🇧🇭")
		expect(getFlag("BI")).toEqual("🇧🇮")
		expect(getFlag("BJ")).toEqual("🇧🇯")
		expect(getFlag("BL")).toEqual("🇧🇱")
		expect(getFlag("BM")).toEqual("🇧🇲")
		expect(getFlag("BN")).toEqual("🇧🇳")
		expect(getFlag("BO")).toEqual("🇧🇴")
		expect(getFlag("BQ")).toEqual("🇧🇶")
		expect(getFlag("BR")).toEqual("🇧🇷")
		expect(getFlag("BS")).toEqual("🇧🇸")
		expect(getFlag("BT")).toEqual("🇧🇹")
		expect(getFlag("BV")).toEqual("🇧🇻")
		expect(getFlag("BW")).toEqual("🇧🇼")
		expect(getFlag("BY")).toEqual("🇧🇾")
		expect(getFlag("BZ")).toEqual("🇧🇿")
		expect(getFlag("CA")).toEqual("🇨🇦")
		expect(getFlag("CC")).toEqual("🇨🇨")
		expect(getFlag("CD")).toEqual("🇨🇩")
		expect(getFlag("CF")).toEqual("🇨🇫")
		expect(getFlag("CG")).toEqual("🇨🇬")
		expect(getFlag("CH")).toEqual("🇨🇭")
		expect(getFlag("CI")).toEqual("🇨🇮")
		expect(getFlag("CK")).toEqual("🇨🇰")
		expect(getFlag("CL")).toEqual("🇨🇱")
		expect(getFlag("CM")).toEqual("🇨🇲")
		expect(getFlag("CN")).toEqual("🇨🇳")
		expect(getFlag("CO")).toEqual("🇨🇴")
		expect(getFlag("CR")).toEqual("🇨🇷")
		expect(getFlag("CU")).toEqual("🇨🇺")
		expect(getFlag("CV")).toEqual("🇨🇻")
		expect(getFlag("CW")).toEqual("🇨🇼")
		expect(getFlag("CX")).toEqual("🇨🇽")
		expect(getFlag("CY")).toEqual("🇨🇾")
		expect(getFlag("CZ")).toEqual("🇨🇿")
		expect(getFlag("DE")).toEqual("🇩🇪")
		expect(getFlag("DJ")).toEqual("🇩🇯")
		expect(getFlag("DK")).toEqual("🇩🇰")
		expect(getFlag("DM")).toEqual("🇩🇲")
		expect(getFlag("DO")).toEqual("🇩🇴")
		expect(getFlag("DZ")).toEqual("🇩🇿")
		expect(getFlag("EC")).toEqual("🇪🇨")
		expect(getFlag("EE")).toEqual("🇪🇪")
		expect(getFlag("EG")).toEqual("🇪🇬")
		expect(getFlag("EH")).toEqual("🇪🇭")
		expect(getFlag("ER")).toEqual("🇪🇷")
		expect(getFlag("ES")).toEqual("🇪🇸")
		expect(getFlag("ET")).toEqual("🇪🇹")
		expect(getFlag("FI")).toEqual("🇫🇮")
		expect(getFlag("FJ")).toEqual("🇫🇯")
		expect(getFlag("FK")).toEqual("🇫🇰")
		expect(getFlag("FM")).toEqual("🇫🇲")
		expect(getFlag("FO")).toEqual("🇫🇴")
		expect(getFlag("FR")).toEqual("🇫🇷")
		expect(getFlag("GA")).toEqual("🇬🇦")
		expect(getFlag("GB")).toEqual("🇬🇧")
		expect(getFlag("GD")).toEqual("🇬🇩")
		expect(getFlag("GE")).toEqual("🇬🇪")
		expect(getFlag("GF")).toEqual("🇬🇫")
		expect(getFlag("GG")).toEqual("🇬🇬")
		expect(getFlag("GH")).toEqual("🇬🇭")
		expect(getFlag("GI")).toEqual("🇬🇮")
		expect(getFlag("GL")).toEqual("🇬🇱")
		expect(getFlag("GM")).toEqual("🇬🇲")
		expect(getFlag("GN")).toEqual("🇬🇳")
		expect(getFlag("GP")).toEqual("🇬🇵")
		expect(getFlag("GQ")).toEqual("🇬🇶")
		expect(getFlag("GR")).toEqual("🇬🇷")
		expect(getFlag("GS")).toEqual("🇬🇸")
		expect(getFlag("GT")).toEqual("🇬🇹")
		expect(getFlag("GU")).toEqual("🇬🇺")
		expect(getFlag("GW")).toEqual("🇬🇼")
		expect(getFlag("GY")).toEqual("🇬🇾")
		expect(getFlag("HK")).toEqual("🇭🇰")
		expect(getFlag("HM")).toEqual("🇭🇲")
		expect(getFlag("HN")).toEqual("🇭🇳")
		expect(getFlag("HR")).toEqual("🇭🇷")
		expect(getFlag("HT")).toEqual("🇭🇹")
		expect(getFlag("HU")).toEqual("🇭🇺")
		expect(getFlag("ID")).toEqual("🇮🇩")
		expect(getFlag("IE")).toEqual("🇮🇪")
		expect(getFlag("IL")).toEqual("🇮🇱")
		expect(getFlag("IM")).toEqual("🇮🇲")
		expect(getFlag("IN")).toEqual("🇮🇳")
		expect(getFlag("IO")).toEqual("🇮🇴")
		expect(getFlag("IQ")).toEqual("🇮🇶")
		expect(getFlag("IR")).toEqual("🇮🇷")
		expect(getFlag("IS")).toEqual("🇮🇸")
		expect(getFlag("IT")).toEqual("🇮🇹")
		expect(getFlag("JE")).toEqual("🇯🇪")
		expect(getFlag("JM")).toEqual("🇯🇲")
		expect(getFlag("JO")).toEqual("🇯🇴")
		expect(getFlag("JP")).toEqual("🇯🇵")
		expect(getFlag("KE")).toEqual("🇰🇪")
		expect(getFlag("KG")).toEqual("🇰🇬")
		expect(getFlag("KH")).toEqual("🇰🇭")
		expect(getFlag("KI")).toEqual("🇰🇮")
		expect(getFlag("KM")).toEqual("🇰🇲")
		expect(getFlag("KN")).toEqual("🇰🇳")
		expect(getFlag("KP")).toEqual("🇰🇵")
		expect(getFlag("KR")).toEqual("🇰🇷")
		expect(getFlag("KW")).toEqual("🇰🇼")
		expect(getFlag("KY")).toEqual("🇰🇾")
		expect(getFlag("KZ")).toEqual("🇰🇿")
		expect(getFlag("LA")).toEqual("🇱🇦")
		expect(getFlag("LB")).toEqual("🇱🇧")
		expect(getFlag("LC")).toEqual("🇱🇨")
		expect(getFlag("LI")).toEqual("🇱🇮")
		expect(getFlag("LK")).toEqual("🇱🇰")
		expect(getFlag("LR")).toEqual("🇱🇷")
		expect(getFlag("LS")).toEqual("🇱🇸")
		expect(getFlag("LT")).toEqual("🇱🇹")
		expect(getFlag("LU")).toEqual("🇱🇺")
		expect(getFlag("LV")).toEqual("🇱🇻")
		expect(getFlag("LY")).toEqual("🇱🇾")
		expect(getFlag("MA")).toEqual("🇲🇦")
		expect(getFlag("MC")).toEqual("🇲🇨")
		expect(getFlag("MD")).toEqual("🇲🇩")
		expect(getFlag("ME")).toEqual("🇲🇪")
		expect(getFlag("MF")).toEqual("🇲🇫")
		expect(getFlag("MG")).toEqual("🇲🇬")
		expect(getFlag("MH")).toEqual("🇲🇭")
		expect(getFlag("MK")).toEqual("🇲🇰")
		expect(getFlag("ML")).toEqual("🇲🇱")
		expect(getFlag("MM")).toEqual("🇲🇲")
		expect(getFlag("MN")).toEqual("🇲🇳")
		expect(getFlag("MO")).toEqual("🇲🇴")
		expect(getFlag("MP")).toEqual("🇲🇵")
		expect(getFlag("MQ")).toEqual("🇲🇶")
		expect(getFlag("MR")).toEqual("🇲🇷")
		expect(getFlag("MS")).toEqual("🇲🇸")
		expect(getFlag("MT")).toEqual("🇲🇹")
		expect(getFlag("MU")).toEqual("🇲🇺")
		expect(getFlag("MV")).toEqual("🇲🇻")
		expect(getFlag("MW")).toEqual("🇲🇼")
		expect(getFlag("MX")).toEqual("🇲🇽")
		expect(getFlag("MY")).toEqual("🇲🇾")
		expect(getFlag("MZ")).toEqual("🇲🇿")
		expect(getFlag("NA")).toEqual("🇳🇦")
		expect(getFlag("NC")).toEqual("🇳🇨")
		expect(getFlag("NE")).toEqual("🇳🇪")
		expect(getFlag("NF")).toEqual("🇳🇫")
		expect(getFlag("NG")).toEqual("🇳🇬")
		expect(getFlag("NI")).toEqual("🇳🇮")
		expect(getFlag("NL")).toEqual("🇳🇱")
		expect(getFlag("NO")).toEqual("🇳🇴")
		expect(getFlag("NP")).toEqual("🇳🇵")
		expect(getFlag("NR")).toEqual("🇳🇷")
		expect(getFlag("NU")).toEqual("🇳🇺")
		expect(getFlag("NZ")).toEqual("🇳🇿")
		expect(getFlag("OM")).toEqual("🇴🇲")
		expect(getFlag("PA")).toEqual("🇵🇦")
		expect(getFlag("PE")).toEqual("🇵🇪")
		expect(getFlag("PF")).toEqual("🇵🇫")
		expect(getFlag("PG")).toEqual("🇵🇬")
		expect(getFlag("PH")).toEqual("🇵🇭")
		expect(getFlag("PK")).toEqual("🇵🇰")
		expect(getFlag("PL")).toEqual("🇵🇱")
		expect(getFlag("PM")).toEqual("🇵🇲")
		expect(getFlag("PN")).toEqual("🇵🇳")
		expect(getFlag("PR")).toEqual("🇵🇷")
		expect(getFlag("PS")).toEqual("🇵🇸")
		expect(getFlag("PT")).toEqual("🇵🇹")
		expect(getFlag("PW")).toEqual("🇵🇼")
		expect(getFlag("PY")).toEqual("🇵🇾")
		expect(getFlag("QA")).toEqual("🇶🇦")
		expect(getFlag("RE")).toEqual("🇷🇪")
		expect(getFlag("RO")).toEqual("🇷🇴")
		expect(getFlag("RS")).toEqual("🇷🇸")
		expect(getFlag("RU")).toEqual("🇷🇺")
		expect(getFlag("RW")).toEqual("🇷🇼")
		expect(getFlag("SA")).toEqual("🇸🇦")
		expect(getFlag("SB")).toEqual("🇸🇧")
		expect(getFlag("SC")).toEqual("🇸🇨")
		expect(getFlag("SD")).toEqual("🇸🇩")
		expect(getFlag("SE")).toEqual("🇸🇪")
		expect(getFlag("SG")).toEqual("🇸🇬")
		expect(getFlag("SH")).toEqual("🇸🇭")
		expect(getFlag("SI")).toEqual("🇸🇮")
		expect(getFlag("SJ")).toEqual("🇸🇯")
		expect(getFlag("SK")).toEqual("🇸🇰")
		expect(getFlag("SL")).toEqual("🇸🇱")
		expect(getFlag("SM")).toEqual("🇸🇲")
		expect(getFlag("SN")).toEqual("🇸🇳")
		expect(getFlag("SO")).toEqual("🇸🇴")
		expect(getFlag("SR")).toEqual("🇸🇷")
		expect(getFlag("SS")).toEqual("🇸🇸")
		expect(getFlag("ST")).toEqual("🇸🇹")
		expect(getFlag("SV")).toEqual("🇸🇻")
		expect(getFlag("SX")).toEqual("🇸🇽")
		expect(getFlag("SY")).toEqual("🇸🇾")
		expect(getFlag("SZ")).toEqual("🇸🇿")
		expect(getFlag("TC")).toEqual("🇹🇨")
		expect(getFlag("TD")).toEqual("🇹🇩")
		expect(getFlag("TF")).toEqual("🇹🇫")
		expect(getFlag("TG")).toEqual("🇹🇬")
		expect(getFlag("TH")).toEqual("🇹🇭")
		expect(getFlag("TJ")).toEqual("🇹🇯")
		expect(getFlag("TK")).toEqual("🇹🇰")
		expect(getFlag("TL")).toEqual("🇹🇱")
		expect(getFlag("TM")).toEqual("🇹🇲")
		expect(getFlag("TN")).toEqual("🇹🇳")
		expect(getFlag("TO")).toEqual("🇹🇴")
		expect(getFlag("TR")).toEqual("🇹🇷")
		expect(getFlag("TT")).toEqual("🇹🇹")
		expect(getFlag("TV")).toEqual("🇹🇻")
		expect(getFlag("TW")).toEqual("🇹🇼")
		expect(getFlag("TZ")).toEqual("🇹🇿")
		expect(getFlag("UA")).toEqual("🇺🇦")
		expect(getFlag("UG")).toEqual("🇺🇬")
		expect(getFlag("UM")).toEqual("🇺🇲")
		expect(getFlag("US")).toEqual("🇺🇸")
		expect(getFlag("UY")).toEqual("🇺🇾")
		expect(getFlag("UZ")).toEqual("🇺🇿")
		expect(getFlag("VA")).toEqual("🇻🇦")
		expect(getFlag("VC")).toEqual("🇻🇨")
		expect(getFlag("VE")).toEqual("🇻🇪")
		expect(getFlag("VG")).toEqual("🇻🇬")
		expect(getFlag("VI")).toEqual("🇻🇮")
		expect(getFlag("VN")).toEqual("🇻🇳")
		expect(getFlag("VU")).toEqual("🇻🇺")
		expect(getFlag("WF")).toEqual("🇼🇫")
		expect(getFlag("WS")).toEqual("🇼🇸")
		expect(getFlag("XK")).toEqual("🇽🇰")
		expect(getFlag("YE")).toEqual("🇾🇪")
		expect(getFlag("YT")).toEqual("🇾🇹")
		expect(getFlag("ZA")).toEqual("🇿🇦")
		expect(getFlag("ZM")).toEqual("🇿🇲")
		expect(getFlag("ZW")).toEqual("🇿🇼")
	})

	it("should return null for an invalid country code", () => {
		expect(getFlag("XYZ")).toEqual("🏳")
	})
})
