
import { render } from "vite-plugin-ssr/abort"
import { products } from "./products.jsx"

export async function onBeforeRender(pageContext: any) {
  const { product } = pageContext.routeParams

  const page = products.find((page) => page.slug === product)
  if (!page) {
    throw render(404)
  }

  return {
    pageContext: {
      pageProps: {
        ...page,
      },
    },
  }
}
