import { createClient } from "@supabase/supabase-js";

// taken from .supabase/docker/docker-compose.yaml
const anonKey =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYwMzk2ODgzNCwiZXhwIjoyNTUwNjUzNjM0LCJyb2xlIjoiYW5vbiJ9.36fUebxgx1mcBo4s19v0SzqmzunP--hm_hep0uLX0ew";

export const supabase = createClient("http://localhost:8000", anonKey);

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
