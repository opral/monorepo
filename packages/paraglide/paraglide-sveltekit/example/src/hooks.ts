import type { Reroute } from '@sveltejs/kit';
import * as paraglideAdapter from '$lib/paraglide/adapter';

export const reroute: Reroute = paraglideAdapter.reroute;
