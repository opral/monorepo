# @inlang/database

The database uses supabase. Currently, supabase is mature (enough) for everything DB related except for
running stuff locally and doing migrations. Therefore, this is a slightly modified local instance of supabase
in combination with prisma for migrations.

## Scripts

> :warning: Some commands time out, don't work. Reason is unknown. Re-running the script usually works.

> :bulb: Docker needs to be installed on your computer and be assigned more than 2GB of RAM (on Mac/Windows).

- `npm start`  
  Starts a local instance of the database with migrations, seeding and application of triggers and policies (ready to consume in front-end etc.).

- `npm stop`  
  Stops the local instance of the database and removes all containers.

- `npm dashboard`  
  Opens a dashboard/table viewer for the data.
  _Is currently using prisma studio; waiting for supabase local dashboard._

- `npm test`  
  Runs all tests in the `/test` directory

- `npm generate-types`

  > :warning: Seems like this command only works when the schema has been applied with `npx prisma db push`.
  > Thus, don't run `npm run start` but `docker-compose ...(see npm start script in packag.json)` followed by
  > the push command and then this command.

  Extracts the types from the SQL schema. The local instance of the database has to be running to succeed.

- `npm seed`  
  Seeds the database.

- `npm create-migration`

  > :warning: Do not use the underlying command "npx prisma db migrate" without the "--create--only" flag. It bricks the database, see [stackoverflow](https://stackoverflow.com/questions/67551593/supabase-client-permission-denied-for-schema-public)

  Creates migration files based on differences in the `schema.prisma` file the previous migrations.

- `npm apply-triggers`  
  The triggers are not covered by SQL migration files/prisma and have to be applied separately.

- `npn apply-policies`  
  Policies are not covered by SQL migration files/prisma and have to be applied separately.

- `npm deploy-to-production`

  > :warning: Ensure that the database url in prisma.schema is pointing to the production instance. **DO NOT LEAK THE PRODUCTION DATABASE URL WITH A GIT COMMIT**

  Applies the migrations, triggers and policies to the database instance as defined in the database url in schema.prisma
