# Running the local database
0. Make sure that Docker Compose [is installed](https://docs.docker.com/compose/install/) and running with elevated privileges.
0. If not installed, install the [`supabase` cli](https://supabase.io/docs/guides/local-development).
1. `supabase start` (can take multiple minutes)
2. `npx prisma migrate dev` (applied the schema if not already and seeds the database)

# Stopping the local database
1. `supabase stop`

# Seed database
Should happen automatically with `npx prisma migrate dev` 
but can be invoked manually with: 
1. run `npx prisma db seed`

# View data
`npx prisma studio`

# Migrating database
0. Update schema.prisma file with updates
1. Run `npx prisma format`
2. Run `npx migrate dev`