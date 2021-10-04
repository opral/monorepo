# Inlang Database

This directory contains the schema for inlang, a local runnable version of the database for
development purposes and auto generated types for type safety.

## Scripts

> :bulb: Docker needs to be installed on your computer and be assigned more than 2GB of RAM (on Mac/Windows).

- `npm start`  
  Starts a local instance of the database with seeding and application of triggers and policies (ready to consume in front-end etc.).

- `npm stop`  
  Stops the local instance of the database and removes all containers.

- `npm dashboard`  
  Opens a dashboard/table viewer for the data.
  _Is currently using prisma studio; waiting for supabase local dashboard._

- `npm test`  
  Runs all tests in the `/test` directory

- `npm generate-types`  
  Extracts the types from the SQL schema. The local instance of the database has to be running to succeed.

- `npm seed`  
  Seeds the database.

- `npm create-migration`

  > :warning: Do not use the underlying command "npx prisma db migrate" without the "--create--only" flag. It bricks the database, see [stackoverflow](https://stackoverflow.com/questions/67551593/supabase-client-permission-denied-for-schema-public)

  Creates migration files based on differences in the `schema.prisma` file the previous migrations **but does not push the changes**.

- `npm push`

  > :warning: Do not use on production instance! Use `npm deploy-to-production` instead.

  Pushes/applies the current schema to the database without taking migrations into account. Great for development purposes, horrible for the production instance.

- `npm apply-triggers`  
  The triggers are not covered by SQL migration files/prisma and have to be applied separately.

- `npn apply-policies`  
  Policies are not covered by SQL migration files/prisma and have to be applied separately.

- `npm deploy-to-production`

  > :warning: Ensure that the database url in prisma.schema is pointing to the production instance. **DO NOT LEAK THE PRODUCTION DATABASE URL WITH A GIT COMMIT**

  Applies the migrations, triggers and policies to the database instance as defined in the database url in schema.prisma
