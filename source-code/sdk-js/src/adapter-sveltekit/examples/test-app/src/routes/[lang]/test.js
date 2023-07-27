import { getRuntimeFromGlobalThis } from '@inlang/sdk-js/adapter-sveltekit/client/shared'

export const test = () => console.info(1111, getRuntimeFromGlobalThis().i('welcome'));