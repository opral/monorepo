import { browser } from '$app/env';
import { goto } from '$app/navigation';
import { User } from '@supabase/gotrue-js';
import { writable } from 'svelte/store';
import { auth } from '../services/auth';

export const userStore = createUserStore();

interface UserStoreInterface {
	data: Readonly<null | User>;
}

function createUserStore() {
	const { subscribe, set } = writable<UserStoreInterface>({
		data: auth.user()
	});

	// if in client side environment, listen for auth changes
	if (browser) {
		// supabase (auth) will call onAuthStateChange
		auth.onAuthStateChange(() => {
			// on each change (doesn't matter what changes)
			set({ data: auth.user() });
		});
	}

	return {
		subscribe
	};
}
