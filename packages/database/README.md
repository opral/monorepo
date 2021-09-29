# Running the local database

0. Make sure that Docker Compose [is installed](https://docs.docker.com/compose/install/) and running with elevated privileges.
1. If not installed, install the [`supabase` cli](https://supabase.io/docs/guides/local-development).
2. `supabase start` (can take multiple minutes)
3. `npx prisma migrate dev` (applied the schema if not already and seeds the database)

# Generating types

The `ANON_API_KEY` can be found in `/.supbase/docker/docker-compose.yaml`.  
In case that an error occurs -> https://github.com/supabase/cli/issues/33

`npx openapi-typescript http://localhost:8000/rest/v1/\?apikey\=<ANON_API_KEY> --output types/definitions.ts`

# Stopping the local database

`supabase stop`

# Seed database

Should happen automatically with `npx prisma migrate dev`
but can be invoked manually with:

`npx prisma db seed`

# View data

`npx prisma studio`

# Migrating database

0. Update schema.prisma file with updates
1. Run `npx prisma format`
2. Run `npx migrate dev`
