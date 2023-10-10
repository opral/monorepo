
import PlannedHero from "#src/components/sections/plannedHero/index.jsx"
import { Meta, Title } from "@solidjs/meta"
import { createSignal, type JSX } from "solid-js"
import { LandingPageLayout as RootLayout } from "../Layout.jsx"
import { CardTag } from "../index/components/CardTag.jsx"
import Email from "../index/sections/01-hero/assets/categories/email.jsx"
import Payments from "../index/sections/01-hero/assets/categories/payments.jsx"
import Website from "../index/sections/01-hero/assets/categories/website.jsx"
import Documents from "../index/sections/01-hero/assets/categories/documents.jsx"

export type PageProps = {
  title: string,
  description: string,
}

export function Page(props: PageProps) {
  const [darkmode, setDarkmode] = createSignal(true)
  const [transparent, setTransparent] = createSignal(true)

  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 916) {
        setDarkmode(false)
      } else {
        setDarkmode(true)
      }

      if (window.scrollY > 50) {
        setTransparent(false)
      } else {
        setTransparent(true)
      }
    })
  }

  let imageComponent: JSX.Element;

  // eslint-disable-next-line solid/reactivity
  switch (props.title) {
    case "Global Email":
      imageComponent = <EmailCard />;
      break;
    case "Global Payments":
      imageComponent = <PaymentsCard />;
      break;
    case "Global Website":
      imageComponent = <WebsiteCard />;
      break;
    case "Global Documents":
      imageComponent = <DocumentsCard />;
      break;
    default:
      imageComponent = <></>;
  }


  return (
    <>
      <Title>inlang {props.title}</Title>
      <Meta
        name="description"
        content={props.description}
      />
      <Meta name="og:image" content="/images/inlang-social-image.jpg" />
      <RootLayout landingpage darkmode={darkmode()} transparent={transparent()}>
        <PlannedHero
          title={props.title}
          description={props.description}
          image={imageComponent}
        />
      </RootLayout>
    </>
  )
}

function EmailCard() {
  return (
		<div class="max-w-sm h-80 bg-[#043855] rounded-3xl mx-auto flex-shrink-0 relative overflow-hidden group border border-primary/0">
			<div class="absolute right-0 bottom-0 z-10">
				<Email />
			</div>
			<CardTag text="Email" globalPrefix noHover />
		</div>
	)
}

function PaymentsCard() {
  return (
		<div class="max-w-sm h-80 bg-surface-700 rounded-3xl mx-auto flex-shrink-0 relative overflow-hidden group border border-primary/0">
			<div class="absolute left-1/2 -translate-x-1/2 bottom-0 z-10">
				<Payments />
			</div>
			<CardTag text="Payments" globalPrefix noHover />
		</div>
	)
}

function WebsiteCard() {
  return (
		<div class="max-w-sm md:max-w-[512px] h-80 bg-surface-800 mx-auto rounded-3xl flex-shrink-0 relative group overflow-hidden border border-primary/0">
			<div class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
				<Website />
			</div>
			<CardTag text="Website" globalPrefix noHover />
		</div>
	)
}

function DocumentsCard() {
  return (
		<div class="max-w-sm h-80 bg-[#043855] mx-auto rounded-3xl flex-shrink-0 relative group border border-primary/0">
			<div class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 overflow-hidden">
				<Documents />
			</div>
			<CardTag text="Documents" globalPrefix noHover />
		</div>
	)
}