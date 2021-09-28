# Running the local database
0. Make sure that Docker Compose is installed and running with elevated privileges
1. Navigate to db directory
2. `supabase start` database is now running
3. To stop database: `supabase stop`

# Populate database with test data
//todo

# Migrating database
0. Update schema.prisma file with updates
1. Run `npx prisma format`
2. Run `npx migrate dev`
