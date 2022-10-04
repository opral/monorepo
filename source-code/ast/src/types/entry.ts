import type { Message, Term, Junk } from "../classes/index.js";
import type { Comments } from "./comments.js";

export type Entry = Message | Term | Comments | Junk;
