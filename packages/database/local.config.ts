import { createClient } from "@supabase/supabase-js";

const anonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.ZopqoUt20nEV9cklpv9e3yw3PVyZLmKs5qLD6nGL1SI";

const serviceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.M2d2z4SFn5C7HlJlaSLfrzuYim9nbY_XI40uWFN3hEE";

export const anonSupabaseClient = createClient(
  "http://localhost:54321",
  anonKey
);

export const serviceSupabaseClient = createClient(
  "http://localhost:54321",
  serviceKey
);

export interface MockUser {
  email: string;
  password: string;
}

export const mockUser: MockUser = {
  email: "dev@account.com",
  password: "dev@account.com",
};

export const mockUser2: MockUser = {
  email: "user@account.com",
  password: "user@account.com",
};
