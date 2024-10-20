import MarketplaceLayout from "#src/interface/marketplace/MarketplaceLayout.jsx";
import { Link as MetaLink, Meta, Title } from "@solidjs/meta";
import * as m from "#src/paraglide/messages.js";
import Link from "#src/renderer/Link.jsx";
import { i18nRouting } from "#src/renderer/+onBeforeRoute.js";
import { currentPageContext } from "#src/renderer/state.js";

export type PageProps = {
  markdown: string;
};

export default function Page() {
  return (
    <>
      <Title>Successfully Unsubcribed from inlang's Newsletter</Title>
      <Meta
        name="description"
        content="inlang's ecosystem makes adapting your application to different markets easy."
      />
      <Meta
        name="og:image"
        content="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/website/public/opengraph/inlang-social-image.jpg"
      />
      {/* <Meta name="robots" content="noindex" /> */}
      <MetaLink
        href={`https://inlang.com${i18nRouting(currentPageContext.urlParsed.pathname).url}`}
        rel="canonical"
      />
      <MarketplaceLayout>
        <div class="relative max-w-screen-xl w-full mx-auto">
          <div class="w-full h-screen flex pt-12 flex-col gap-16">
            <div class="w-full flex flex-col gap-6 h-full mx-auto justify-center max-w-lg mt-32 mb-8 px-6 relative z-10">
              <h1 class="text-[40px] text-center leading-tight md:text-5xl font-bold text-surface-900 tracking-tight">
                {m.newsletter_unsubscribed_title()}
              </h1>
              <p class="text-lg text-surface-600 leading-relaxed mx-auto text-center">
                {m.newsletter_unsubscribed_description()}
                <Link
                  class="text-primary hover:text-hover-primary font-semibold ml-1.5"
                  href="https://discord.gg/gdMPPWy57R"
                  target="_blank"
                >
                  Discord
                </Link>
                .
              </p>
            </div>
            <div class="w-full h-screen relative">
              <div class="flex flex-col w-full h-full justify-end items-center">
                <div class="h-full w-[2px] bg-gradient-to-t from-surface-100 to-hover-primary relative z-0">
                  <div class="w-full flex justify-center h-full z-3 ml-0">
                    <div class="text-hover-primary bg-[#FFF] z-10 flex justify-center items-center text-center mx-auto h-12 w-12 rounded-full bg-white border-2 border-hover-primary absolute -top-6">
                      <div class="w-0.5 rounded-full h-3/4 rotate-45 absolute bg-hover-primary" />
                      <div class="w-0.5 rounded-full h-3/4 -rotate-45 absolute bg-hover-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MarketplaceLayout>
    </>
  );
}
