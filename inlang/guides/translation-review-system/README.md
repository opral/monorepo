## Translation Review System - Ensure project-wide quality

As your i18n project grows, ensuring the quality of translations becomes crucial. To achieve this, you can establish a review system.

The goal of this system is to meet a certain standard for translations.

### Change Control enables your review system?

1. You have complete control over the quality of translations and what gets merged or not.
2. You can set up mechanisms to automatically assign people responsible for maintaining a specific language.
3. You can suggest changes and collaborate on the same base.

## Hands-on Guide

Because lix is git compatible, you can use the mechanisms of GitHub to build this system.

1. Create a inlang project https://manage.inlang.com
2. After pushing changes on a fork you can open a PR
3. In this PR you can assign people (Devs, PM, Legal, Translator ...)
4. You can use github actions to auto assign people (https://github.com/marketplace/actions/auto-request-review)
5. Set a number of required reviews 