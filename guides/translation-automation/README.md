![image](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/guides/translation-automation/assets/lix-guide-automation.png)

## Translation Automation - with lint and machine translation

A common problem with i18n processes is the presence of manual steps and broken translations. These efforts are continuous instead of being a one-time activity. However, an automation system can help manage this issue. To establish the automation we can use the [CLI](https://inlang.com/m/2qj2w8pu/app-inlang-cli).

## When does Translation Automation becomes handy?

- New feature development requires new translations
- Newly added languages need new translations
- The new design gives new context that needs to be translated
- New brand guide line requires updated translations
- And many more...

## How does Change Control enable your review system?

- Use machine translations to fully automate or give a starting point
- Lint your translation content to ensure quality

## Don't want translations to be machine translated?

Sometimes machine translations don't match your quality standards and you want your translations to be done by humans. In this case, you can use the [Ninja i18n](https://inlang.com/m/3gk8n4n4) GitHub action to get lint reports in your pull requests, including links to the relevant messages, and have your team translate the content using the [Fink localization editor](https://inlang.com/m/tdozzpar). You can find more information about Ninja i18n [here](https://inlang.com/m/3gk8n4n4).

## Hands-on Guide

Because lix is git compatible, you can use the mechanisms of GitHub to build this system.

1. Create a inlang project https://manage.inlang.com
![image](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/guides/translation-review-system/assets/lix-guide-review-step1.png)

2. Install the CLI
```bash
npx @inlang/cli [command]
```

3. Setup [Lint](https://inlang.com/m/2qj2w8pu/app-inlang-cli#lint) in CI/CD. You can add this to your test step. 
```json
"test": npx @inlang/cli lint --project <projectPath>
```

4. Setup [Machine Translate](https://inlang.com/m/2qj2w8pu/app-inlang-cli#machine-translate) in CI/CD. You can add this to your build step. 
```json
"build": npx @inlang/cli machine translate --project <projectPath>
```

### How we do it on inlang.com

```json
"build": "npx @inlang/cli machine translate -f --project ../../../project.inlang --targetLanguageTags fr,it,pt-BR,sk,zh"
"test": "npx @inlang/cli lint --project ../../../project.inlang
```

**Add this to you build and test step to:**

- [Machine translate](https://inlang.com/m/2qj2w8pu/app-inlang-cli#machine-translate) through build step. We want to shift more quality to en and de, that is why we don't machine translate them. We cnsider the other languages comunity languages. When they have weak translations, the community can open a PR through fink.
- [Lint](https://inlang.com/m/2qj2w8pu/app-inlang-cli#lint) through test step. We let the lint command throw errors when translations are missing. There is not only the `missing message` lint rule. There are differen [lint rules](https://inlang.com/c/lint-rules) for different use cases, that can be configured as error or warning.

<br>
<br>