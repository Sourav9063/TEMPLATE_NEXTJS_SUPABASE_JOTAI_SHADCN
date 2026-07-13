# Supabase Keep-Alive

The GitHub Actions workflow at
[`/.github/workflows/supabase-keep-alive.yml`](../../.github/workflows/supabase-keep-alive.yml)
runs `SELECT 1` twice daily to generate database activity for a Supabase Free
Tier project.

## Configuration

Create a repository Actions secret named `SUPABASE_DATABASE_URL`.

1. In the Supabase Dashboard, open the project’s **Connect** panel.
2. Copy the **Session pooler** PostgreSQL connection string.
3. Remove the `pgbouncer=true` query parameter. It is for supported
   application drivers and is not accepted by the workflow’s `psql` command.
4. In GitHub, open **Settings → Secrets and variables → Actions**, create
   `SUPABASE_DATABASE_URL`, and paste the resulting connection string.

The URL contains database credentials. Store it only as a GitHub Actions
secret; do not commit it or expose it through a `NEXT_PUBLIC_*` variable.

## Operation

The workflow runs at 03:00 and 15:00 UTC. To test it, open the repository’s
**Actions** tab, select **Keep Supabase active**, then choose **Run workflow**.

It sets `PGSSLMODE=require` and executes:

```sql
SELECT 1;
```

No other GitHub secrets are required.
