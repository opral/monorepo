module.exports = {
  plugins: ["@typescript-eslint", "unicorn"],
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  rules: {
    "unicorn/no-array-for-each": "error",
    "unicorn/prefer-spread": "warn",
    "unicorn/prefer-array-find": "error",
    "unicorn/prefer-array-flat": "error",
    "unicorn/prefer-array-flat-map": "error",
    "unicorn/prefer-array-index-of": "error",
    "unicorn/prefer-array-some": "error",
    "unicorn/no-null": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
  },
};
