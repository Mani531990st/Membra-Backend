import type { db } from "./index";

/** Shared Drizzle database client. */
export type Database = typeof db;

/**
 * Transaction client passed into `db.transaction(async (tx) => ...)`.
 * Repositories that participate in a use-case transaction must accept this
 * (or {@link DbOrTx}) so all writes share the same connection.
 */
export type DbTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

/** Either the root client or an active transaction. */
export type DbOrTx = Database | DbTransaction;
