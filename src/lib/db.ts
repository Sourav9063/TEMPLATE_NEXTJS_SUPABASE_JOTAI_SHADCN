import {
  Pool,
  type PoolClient,
  type QueryResult,
  type QueryResultRow,
} from "pg";
import { PostgresError } from "pg-error-enum";
import { AppError } from "@/lib/utils/error";

const globalForPg = global as unknown as { pgPool: Pool };

export const pool =
  globalForPg.pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.NODE_ENV === "production" ? 10 : 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

// CRITICAL: Catch errors on idle clients to prevent server crashes
pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
});

/**
 * Standard query execution for simple SELECT, INSERT, UPDATE, DELETE.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;

  if (duration > 1000) {
    console.warn("Slow query detected:", {
      text,
      duration,
      rows: res.rowCount,
    });
  }

  return res;
}

/**
 * Transaction helper.
 * Use this to execute multiple queries atomically on the same connection.
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export const handleDbError = (error: unknown): never => {
  if (typeof error === "object" && error !== null && "code" in error) {
    switch ((error as { code: string }).code) {
      // 409 Conflict - The standard text is "Conflict"
      case PostgresError.UNIQUE_VIOLATION:
      case PostgresError.EXCLUSION_VIOLATION:
        throw new AppError(
          409,
          "This record already exists or conflicts with another.",
        );

      // 404 Not Found
      case PostgresError.FOREIGN_KEY_VIOLATION:
        throw new AppError(404, "The referenced record could not be found.");

      // 400 Bad Request
      case PostgresError.NOT_NULL_VIOLATION:
      case PostgresError.CHECK_VIOLATION:
        throw new AppError(400, "Invalid or missing data provided.");

      // 408 Request Timeout
      case PostgresError.QUERY_CANCELED:
        throw new AppError(408, "The database query timed out.");

      // 503 Service Unavailable
      case PostgresError.CONNECTION_EXCEPTION:
      case PostgresError.CONNECTION_DOES_NOT_EXIST:
      case PostgresError.CONNECTION_FAILURE:
      case PostgresError.TOO_MANY_CONNECTIONS:
        throw new AppError(503, "The database is temporarily unavailable.");

      // 403 Forbidden
      case PostgresError.INSUFFICIENT_PRIVILEGE:
        throw new AppError(
          403,
          "You do not have permission to perform this action.",
        );
    }
  }

  // If it's an unhandled error, standard practice is a 500 Internal Server Error
  throw new AppError(500, "An unexpected database error occurred.");
};
