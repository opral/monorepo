# Running the local database
0. Make sure that Docker Compose is installed and running with elevated privileges
1. Navigate to db directory
2. `supabase start`

# Stopping the local database
0. Navigate to db directory
1. `supabase stop`

# Seed database
0. Navigate to db directory
1. run `node src/seed.js`

# Remove all data from database
> :warning: only use on local dev environment
0. Navigate to db directory
1. run `node src/reset.js`

# Migrating database
0. Update schema.prisma file with updates
1. Run `npx prisma format`
2. Run `npx migrate dev`