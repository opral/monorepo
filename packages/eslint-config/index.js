module.exports = {
  plugins: ["@typescript-eslint", "unicorn"],
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:unicorn/recommended",
    "prettier",
  ],
  rules: {
    "unicorn/prevent-abbreviations": "off",
    "unicorn/new-for-builtins": "off",
    "unicorn/no-useless-undefined": "off",
    "@typescript-eslint/explicit-function-return-type": [
      "error",
      {
        allowExpressions: true,
      },
    ],
  },
};
