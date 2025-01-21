import type { Handle } from '@sveltejs/kit';
import * as paraglideAdapter from '$lib/paraglide/adapter';

export const handle: Handle = paraglideAdapter.handle;
