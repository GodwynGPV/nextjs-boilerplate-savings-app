import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = (process.env.DATABASE_URL ?? process.env.POSTGRES_URL)!;

const client = postgres(connectionString, { max: 1, prepare: false, connection: { search_path: "public" } });
export const db = drizzle(client, { schema });
