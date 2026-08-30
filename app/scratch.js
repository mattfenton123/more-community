const fs = require('fs');
const dotenv = require('dotenv');
const { Client } = require('pg');

const env = dotenv.parse(fs.readFileSync('.env.local'));
const connectionString = env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', 'postgres://postgres.').replace('.supabase.co', ':6543/postgres');
// I need the actual connection string. Supabase URL is https://nkyithbhufwgwnbxvqqu.supabase.co
// The connection string is usually postgres://postgres.[project-ref]:[password]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres
// Since I don't have the password for direct Postgres connection, I can't use pg easily!
