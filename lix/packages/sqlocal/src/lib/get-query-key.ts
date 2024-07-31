import { nanoid } from 'nanoid';
import { QueryKey } from '../types.js';

export function getQueryKey(): QueryKey {
	return nanoid();
}
