import { Pool, type QueryResultRow } from "pg";

export type PalLinkRow = {
  partnerId: string;
  displayName: string;
  updatedAt: number;
};

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL. Configure a Postgres connection for pal sync.");
  }
  pool = new Pool({ connectionString });
  return pool;
}

function orderedPair(userA: string, userB: string): { low: string; high: string } {
  return userA < userB ? { low: userA, high: userB } : { low: userB, high: userA };
}

export async function listPalLinks(userId: string): Promise<PalLinkRow[]> {
  const sql = `
    SELECT
      CASE WHEN user_low = $1 THEN user_high ELSE user_low END AS partner_id,
      CASE
        WHEN user_low = $1 THEN COALESCE(high_display_name, 'Partner')
        ELSE COALESCE(low_display_name, 'Partner')
      END AS display_name,
      EXTRACT(EPOCH FROM updated_at) * 1000 AS updated_at_ms
    FROM pal_links
    WHERE user_low = $1 OR user_high = $1
    ORDER BY updated_at DESC
  `;
  const res = await getPool().query(sql, [userId]);
  return res.rows.map((r: QueryResultRow) => ({
    partnerId: String(r.partner_id),
    displayName: String(r.display_name || "Partner"),
    updatedAt: Number(r.updated_at_ms || Date.now())
  }));
}

export async function upsertPalLink(params: {
  meId: string;
  partnerId: string;
  partnerDisplayName?: string;
  myDisplayNameForPartner?: string;
}): Promise<void> {
  const { meId, partnerId, partnerDisplayName, myDisplayNameForPartner } = params;
  const { low, high } = orderedPair(meId, partnerId);
  const lowName = low === meId ? myDisplayNameForPartner : partnerDisplayName;
  const highName = high === meId ? myDisplayNameForPartner : partnerDisplayName;
  const sql = `
    INSERT INTO pal_links (user_low, user_high, low_display_name, high_display_name, updated_at)
    VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''), NOW())
    ON CONFLICT (user_low, user_high)
    DO UPDATE
    SET
      low_display_name = COALESCE(NULLIF(EXCLUDED.low_display_name, ''), pal_links.low_display_name),
      high_display_name = COALESCE(NULLIF(EXCLUDED.high_display_name, ''), pal_links.high_display_name),
      updated_at = NOW()
  `;
  await getPool().query(sql, [low, high, lowName?.trim() ?? "", highName?.trim() ?? ""]);
}

export async function deletePalLink(meId: string, partnerId: string): Promise<void> {
  const { low, high } = orderedPair(meId, partnerId);
  await getPool().query("DELETE FROM pal_links WHERE user_low = $1 AND user_high = $2", [low, high]);
}
