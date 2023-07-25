import { getRuntimeFromGlobalThis } from '@inlang/sdk-js/adapter-sveltekit/client/shared'

export const test = () => console.log(1111, getRuntimeFromGlobalThis().i('welcome'));