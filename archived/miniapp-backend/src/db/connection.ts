import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_lTzC0mxWsB5Q@ep-polished-mouse-a4uyrpkq-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

// Create postgres client
export const client = postgres(databaseUrl)

// Create Drizzle instance (for future use)
export const db = drizzle(client)

console.log('✅ Database connection established')

