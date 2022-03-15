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
    "unicorn/filename-case": "off",
    "unicorn/prefer-ternary": "off",
    "unicorn/throw-new-error": "off",
    "unicorn/prefer-spread": "off",
    "unicorn/prefer-node-protocol": "off",
    "unicorn/no-await-expression-member": "off",
    "@typescript-eslint/explicit-function-return-type": [
      "error",
      {
        allowExpressions: true,
      },
    ],
  },
};
