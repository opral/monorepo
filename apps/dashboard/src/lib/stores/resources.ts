import { Resources } from '@inlang/fluent-ast';
import { writable } from 'svelte/store';

/**
 * Resources of a project.
 * 
 * Is late initialized. 
 */
export const resources = writable<Resources>();
