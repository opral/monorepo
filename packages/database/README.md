# Running the local database
0. Make sure that Docker Compose [is installed](https://docs.docker.com/compose/install/) and running with elevated privileges.
0. If not installed, install the [`supabase` cli](https://supabase.io/docs/guides/local-development).
1. Navigate to db directory
2. If no .env file exist, create one with 
```
DATABASE_URL="postgres://postgres:postgres@localhost:5432/postgres"
```
2. `supabase start` (can take multiple minutes)

# Stopping the local database
0. Navigate to db directory
1. `supabase stop`

# Seed database
0. Navigate to db directory
1. run `node src/seed.js`

# View data
`npx prisma studio`

# Remove all data from database
> :warning: only use on local dev environment
0. Navigate to db directory
1. run `node src/reset.js`

# Migrating database
0. Update schema.prisma file with updates
1. Run `npx prisma format`
2. Run `npx migrate dev`