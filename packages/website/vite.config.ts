import type { UserConfig } from "vite";
import solid from "vite-plugin-solid";
import { ssr as vitePluginSsr } from "vite-plugin-ssr/plugin";
import { telefunc } from "telefunc/vite";
import { fileURLToPath, URL } from "url";
import Icons from "unplugin-icons/vite";

export default await withNodePolyfills({
  plugins: [
    solid({ ssr: true }),
    // ordering matters. telefunc must be before ssr
    telefunc(),
    // the metaframework https://vite-plugin-ssr.com/
    vitePluginSsr(),
    // @ts-ignore
    // only https://icon-sets.iconify.design/material-symbols/
    // and https://icon-sets.iconify.design/cib/
    // are installed indicated in the package.json @iconify-json/* packages.
    // use those sites to search for icons.
    Icons({ compiler: "solid" }),
    // markdownHotModuleReload(),
  ],
  resolve: {
    alias: {
      // must also be defined in tsconfig!
      "@src": fileURLToPath(new URL("./src", import.meta.url)),
      "@env": fileURLToPath(new URL("./env.ts", import.meta.url)),
    },
  },
  build: {
    // target is es2022 to support top level await
    // https://caniuse.com/?search=top%20level%20await
    target: "es2022",
  },
});

/**
 * Polyfills to use fs in the browser.
 *
 * Seperated from the main config for readability.
 * Adapted from https://stackoverflow.com/questions/69286329/polyfill-node-os-module-with-vite-rollup-js
 */
async function withNodePolyfills(config: UserConfig): Promise<UserConfig> {
  const { merge } = await import("lodash-es");
  const polyfillConfig: UserConfig = {
    define: {
      global: "window",
    },
    resolve: {
      alias: {
        events: "rollup-plugin-node-polyfills/polyfills/events",
        path: "rollup-plugin-node-polyfills/polyfills/path",
        process: "rollup-plugin-node-polyfills/polyfills/process-es6",
        buffer: "rollup-plugin-node-polyfills/polyfills/buffer-es6",
        util: "rollup-plugin-node-polyfills/polyfills/util",
        sys: "util",
        stream: "rollup-plugin-node-polyfills/polyfills/stream",
        querystring: "rollup-plugin-node-polyfills/polyfills/qs",
        punycode: "rollup-plugin-node-polyfills/polyfills/punycode",
        url: "rollup-plugin-node-polyfills/polyfills/url",
        string_decoder: "rollup-plugin-node-polyfills/polyfills/string-decoder",
        http: "rollup-plugin-node-polyfills/polyfills/http",
        https: "rollup-plugin-node-polyfills/polyfills/http",
        os: "rollup-plugin-node-polyfills/polyfills/os",
        assert: "rollup-plugin-node-polyfills/polyfills/assert",
        constants: "rollup-plugin-node-polyfills/polyfills/constants",
        _stream_duplex:
          "rollup-plugin-node-polyfills/polyfills/readable-stream/duplex",
        _stream_passthrough:
          "rollup-plugin-node-polyfills/polyfills/readable-stream/passthrough",
        _stream_readable:
          "rollup-plugin-node-polyfills/polyfills/readable-stream/readable",
        _stream_writable:
          "rollup-plugin-node-polyfills/polyfills/readable-stream/writable",
        _stream_transform:
          "rollup-plugin-node-polyfills/polyfills/readable-stream/transform",
        timers: "rollup-plugin-node-polyfills/polyfills/timers",
        console: "rollup-plugin-node-polyfills/polyfills/console",
        vm: "rollup-plugin-node-polyfills/polyfills/vm",
        zlib: "rollup-plugin-node-polyfills/polyfills/zlib",
        tty: "rollup-plugin-node-polyfills/polyfills/tty",
        domain: "rollup-plugin-node-polyfills/polyfills/domain",
      },
    },
  };
  return merge(polyfillConfig, config);
}
