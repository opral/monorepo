import type { PageProps } from "#src/pages/@product/index.page.jsx"
import { CardTag } from "#src/pages/index/components/CardTag.jsx"
import { SectionLayout } from "#src/pages/index/components/sectionLayout.jsx"
import Documents from "#src/pages/index/sections/01-hero/assets/categories/documents.jsx"
import Email from "#src/pages/index/sections/01-hero/assets/categories/email.jsx"
import Payments from "#src/pages/index/sections/01-hero/assets/categories/payments.jsx"
import Website from "#src/pages/index/sections/01-hero/assets/categories/website.jsx"
import { Match, Switch } from "solid-js"

const PlannedHero = (props: PageProps) => {
  return (
    <>
      <SectionLayout showLines={true} type="dark">
        <div class="w-full flex px-6 md:px-10 pt-40 lg:pt-60 pb-24 md:pb-24 flex-col-reverse lg:flex-row">
          <div class="w-full lg:w-1/2 flex flex-col gap-8 pt-20 lg:pt-0">
            <h1 class="text-[40px] leading-tight md:text-6xl font-bold text-background pr-16 tracking-tight">
              inlang <br />
              <span class="bg-clip-text text-[rgba(0,0,0,0)] bg-gradient-to-tl from-[#F1D9FF] via-hover-primary to-[#3B82F6]">
                {props.content.title}
              </span>
            </h1>
            <p class="text-surface-300 text-xl max-w-sm">
              {props.content.description}
            </p>
            <div class="flex md:items-center items-start gap-8">
              <a href={"/"} class="-ml-0.5 flex-shrink-0">
                <button class="relative bg-surface-800">
                  <div class="relative z-20 bg-surface-200 h-10 px-6 flex justify-center items-center shadow rounded-md hover:shadow-lg hover:bg-background transition-all">
                    <span class="bg-clip-text text-[rgba(0,0,0,0)] bg-gradient-to-tl from-surface-900 via-surface-800 to-surface-900 text-sm font-medium">
                      Stay informed
                    </span>
                  </div>
                  <div
                    style={{
                      background:
                        "linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
                    }}
                    class="absolute z-0 bg-on-background top-0 left-0 w-full h-full opacity-60 blur-3xl"
                  />
                  <div
                    style={{
                      background:
                        "linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
                    }}
                    class="absolute z-0 bg-on-background top-0 left-0 w-full h-full opacity-40 blur-xl"
                  />
                  <div
                    style={{
                      background:
                        "linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
                    }}
                    class="absolute z-0 bg-on-background top-0 left-0 w-full h-full opacity-80 blur-sm"
                  />
                </button>
              </a>
            </div>
          </div>
          <div class="w-full lg:w-1/2">
            <Switch fallback={<></>}>
              <Match when={props.slug === "email"}>
                <EmailCard />
              </Match>
              <Match when={props.slug === "payments"}>
                <PaymentsCard />
              </Match>
              <Match when={props.slug === "website"}>
                <WebsiteCard />
              </Match>
              <Match when={props.slug === "documents"}>
                <DocumentsCard />
              </Match>
            </Switch>
          </div>
        </div>
      </SectionLayout>
    </>
  )
}

export default PlannedHero


function EmailCard() {
  return (
    <div
      class="max-w-sm h-80 bg-[#043855] rounded-3xl flex-shrink-0 relative overflow-hidden group border border-primary/0"
    >
      <div class="absolute right-0 bottom-0 z-10">
        <Email />
      </div>
      <CardTag text="Email" globalPrefix noHover />
    </div>
  )
}

function PaymentsCard() {
  return (
    <div
      class="max-w-sm h-80 bg-surface-700 rounded-3xl flex-shrink-0 relative overflow-hidden group border border-primary/0"
    >
      <div class="absolute left-1/2 -translate-x-1/2 bottom-0 z-10">
        <Payments />
      </div>
      <CardTag text="Payments" globalPrefix noHover />
    </div>
  )
}

function WebsiteCard() {
  return (
    <div
      class="max-w-sm md:max-w-[512px] h-80 bg-surface-800 rounded-3xl flex-shrink-0 relative group overflow-hidden border border-primary/0"
    >
      <div class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
        <Website />
      </div>
      <CardTag text="Website" globalPrefix noHover />
    </div>
  )
}

function DocumentsCard() {
  return (
    <div
      class="max-w-sm h-80 bg-[#043855] rounded-3xl flex-shrink-0 relative group border border-primary/0"
    >
      <div class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 overflow-hidden">
        <Documents />
      </div>
      <CardTag text="Documents" globalPrefix noHover />
    </div>
  )
}