# Running the local database
0. Make sure that Docker Compose is installed and running with elevated privileges
1. Navigate to db directory
2. `supabase start`

# Stopping the local database
0. Navigate to db directory
1. `supabase stop`

# Populate database with test data
//todo

# Migrating database
0. Update schema.prisma file with updates
1. Run `npx prisma format`
2. Run `npx migrate dev`

# Datamodel changes
After changing the datamodel the Prisma Client should be re-generated using `prisma generate`