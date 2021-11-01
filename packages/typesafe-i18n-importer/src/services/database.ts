import { createClient } from '@supabase/supabase-js'

// Hardcoded for now. The key is anonymous, thus can be commited to git.

const supabaseUrl = 'https://fyhpvrhxlylivpmmjjby.supabase.co'
const supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNDU1NTI5MCwiZXhwIjoxOTUwMTMxMjkwfQ.DG40_Sz-62Gae-0gYj7gp9VT-eTXdQ-79MtYGwyYWiA'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const database = supabase
