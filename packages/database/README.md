# Running the local database

0. Make sure that Docker Compose [is installed](https://docs.docker.com/compose/install/) and running with elevated privileges.
1. `npm install`
2. `npm run start`

To stop:
`npm run stop`

# Generating types

`npm run generate-types`

Note that `generate-types` expects the anon key as given in the docker compose.
The `ANON_API_KEY` can be found in `/.supbase/docker/docker-compose.yaml`.  
In case that an error occurs -> https://github.com/supabase/cli/issues/33

**Manually:**

- `npx openapi-typescript http://localhost:8000/rest/v1/\?apikey\=<ANON_API_KEY> --output types/definitions.ts`
- with current local anon key `http://localhost:8000/rest/v1/\?apikey\=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYwMzk2ODgzNCwiZXhwIjoyNTUwNjUzNjM0LCJyb2xlIjoiYW5vbiJ9.36fUebxgx1mcBo4s19v0SzqmzunP--hm_hep0uLX0ew --output types/definitions.ts`

# Stopping the local database

`supabase stop`

# Seed database

Should happen automatically with `npm run start`
but can be invoked manually with:

`npx prisma db seed`

# View data

`npx prisma studio`

*Hopefully, the supabase dashboard can be run locally.* 

# Migrating database

0. Update schema.prisma file with updates
1. Run `npx prisma format`
1. Run `npx migrate deploy`

# Init database triggers

0. triggers can only be dropped from supabase dashboard (to drop reset database by deleting docker container)
1. Run `npm run apply-triggers`
