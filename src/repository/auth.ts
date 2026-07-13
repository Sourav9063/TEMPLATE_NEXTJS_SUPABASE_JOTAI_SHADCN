import type { PoolClient } from "pg";
import { handleDbError, query, withTransaction } from "@/lib/db";
import type { UserRow } from "@/types/auth";

interface UserProfile {
  displayName?: string;
  avatarUrl?: string;
}

export const AuthRepository = {
  async cleanupExpiredData(): Promise<void> {
    try {
      await withTransaction(async (client: PoolClient) => {
        await client.query(
          `DELETE FROM auth_challenges
           WHERE expires_at < now()
              OR used_at < now() - interval '1 day'`,
        );
        await client.query(
          `DELETE FROM sessions
           WHERE expires_at < now()
              OR revoked_at < now() - interval '1 day'`,
        );
      });
    } catch (error: unknown) {
      handleDbError(error);
    }
  },

  async findOrCreateUser(
    email: string,
    profile?: UserProfile,
  ): Promise<UserRow> {
    try {
      const result = await query<UserRow>(
        `INSERT INTO users (email, display_name, avatar_url)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET
           display_name = COALESCE(EXCLUDED.display_name, users.display_name),
           avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url)
         RETURNING id, email, created_at, last_seen_at, display_name, avatar_url`,
        [email, profile?.displayName ?? null, profile?.avatarUrl ?? null],
      );
      return result.rows[0];
    } catch (error: unknown) {
      return handleDbError(error);
    }
  },

  async createChallenge(
    userId: string,
    codeHash: string,
    magicTokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    try {
      await withTransaction(async (client: PoolClient) => {
        await client.query(
          `UPDATE auth_challenges
           SET used_at = now()
           WHERE user_id = $1 AND used_at IS NULL`,
          [userId],
        );
        await client.query(
          `INSERT INTO auth_challenges
            (user_id, code_hash, magic_token_hash, expires_at)
           VALUES ($1, $2, $3, $4)`,
          [userId, codeHash, magicTokenHash, expiresAt],
        );
      });
    } catch (error: unknown) {
      handleDbError(error);
    }
  },

  async consumeCode(email: string, codeHash: string): Promise<UserRow | null> {
    try {
      return await withTransaction(async (client: PoolClient) => {
        const result = await client.query<UserRow & { challenge_id: string }>(
          `SELECT u.id, u.email, u.created_at, u.last_seen_at,
                  c.id AS challenge_id
           FROM auth_challenges c
           JOIN users u ON u.id = c.user_id
           WHERE u.email = $1
             AND c.code_hash = $2
             AND c.used_at IS NULL
             AND c.expires_at > now()
             AND c.attempts < 5
           ORDER BY c.created_at DESC
           LIMIT 1
           FOR UPDATE OF c`,
          [email, codeHash],
        );
        const record = result.rows[0];
        if (!record) {
          await client.query(
            `UPDATE auth_challenges c
             SET attempts = attempts + 1
             FROM users u
             WHERE c.user_id = u.id
               AND u.email = $1
               AND c.used_at IS NULL
               AND c.expires_at > now()`,
            [email],
          );
          return null;
        }
        await client.query(
          `UPDATE auth_challenges SET used_at = now() WHERE id = $1`,
          [record.challenge_id],
        );
        await client.query(
          `UPDATE users SET last_seen_at = now() WHERE id = $1`,
          [record.id],
        );
        return record;
      });
    } catch (error: unknown) {
      return handleDbError(error);
    }
  },

  async consumeMagicToken(tokenHash: string): Promise<UserRow | null> {
    try {
      return await withTransaction(async (client: PoolClient) => {
        const result = await client.query<UserRow & { challenge_id: string }>(
          `SELECT u.id, u.email, u.created_at, u.last_seen_at,
                  c.id AS challenge_id
           FROM auth_challenges c
           JOIN users u ON u.id = c.user_id
           WHERE c.magic_token_hash = $1
             AND c.used_at IS NULL
             AND c.expires_at > now()
           LIMIT 1
           FOR UPDATE OF c`,
          [tokenHash],
        );
        const record = result.rows[0];
        if (!record) return null;
        await client.query(
          `UPDATE auth_challenges SET used_at = now() WHERE id = $1`,
          [record.challenge_id],
        );
        await client.query(
          `UPDATE users SET last_seen_at = now() WHERE id = $1`,
          [record.id],
        );
        return record;
      });
    } catch (error: unknown) {
      return handleDbError(error);
    }
  },

  async createSession(
    sessionId: string,
    userId: string,
    expiresAt: Date,
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO sessions (id, user_id, expires_at)
         VALUES ($1, $2, $3)`,
        [sessionId, userId, expiresAt],
      );
    } catch (error: unknown) {
      handleDbError(error);
    }
  },

  async isSessionActive(sessionId: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT 1 FROM sessions
         WHERE id = $1 AND revoked_at IS NULL AND expires_at > now()`,
        [sessionId],
      );
      return result.rowCount === 1;
    } catch (error: unknown) {
      return handleDbError(error);
    }
  },

  async revokeSession(sessionId: string): Promise<void> {
    try {
      await query(
        `UPDATE sessions SET revoked_at = now()
         WHERE id = $1 AND revoked_at IS NULL`,
        [sessionId],
      );
    } catch (error: unknown) {
      handleDbError(error);
    }
  },
};
