import { database } from './database';

// solely exists because the project started out with seperation of database and auth
// but is just a wrapper
export const auth = database.auth;
