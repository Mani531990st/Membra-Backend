import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const rows = await sql`
  SELECT id, hash, created_at
  FROM drizzle.__drizzle_migrations
  ORDER BY id
`;
console.log(JSON.stringify(rows, null, 2));
const counts = await sql`
  SELECT COUNT(*)::int AS app_tables
  FROM information_schema.tables
  WHERE table_schema = 'app'
`;
console.log("app_tables:", counts[0].app_tables);
await sql.end();
