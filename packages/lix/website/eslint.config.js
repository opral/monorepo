import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      eslintPluginReactHooks,
    },
    files: ["src/**/*.{ts,jsx,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
