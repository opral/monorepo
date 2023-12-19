import NextLink from "next/link"
import React from "react"

export function Link(props: Parameters<typeof NextLink>[0]): ReturnType<typeof NextLink> {
	return <NextLink href="/de">{props.children}</NextLink>
}
