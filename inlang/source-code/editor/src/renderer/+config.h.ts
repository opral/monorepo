import type { Config } from "vike/types";

export default {
  clientRouting: true,
  meta: {
    Root: {
      env: { server: true, client: true },
    },
  },
} satisfies Config;
