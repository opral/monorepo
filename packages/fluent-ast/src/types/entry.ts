import type { Message, Term, Junk } from '../classes';
import type { Comments } from './comments';

export type Entry = Message | Term | Comments | Junk;
