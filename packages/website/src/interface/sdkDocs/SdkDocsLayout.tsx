import type { JSXElement } from "solid-js";
import SdkDocsHeader from "./SdkDocsHeader.jsx";
import Footer from "./SdkDocsFooter.jsx";

const SdkDocsLayout = (props: { children: JSXElement }) => {
  return (
    <div class="bg-surface-50 min-h-screen">
      <SdkDocsHeader />
      <div class="w-full px-4 md:px-8 xl:px-4 min-h-[calc(100vh_-_107px_-_480px)]">
        <div class="max-w-7xl mx-auto">{props.children}</div>
      </div>
      <Footer />
    </div>
  );
};

export default SdkDocsLayout;
