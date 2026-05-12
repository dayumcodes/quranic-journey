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

export async function palLinkExists(userA: string, userB: string): Promise<boolean> {
  const { low, high } = orderedPair(userA, userB);
  const res = await getPool().query("SELECT 1 FROM pal_links WHERE user_low = $1 AND user_high = $2 LIMIT 1", [low, high]);
  return (res.rowCount ?? 0) > 0;
}

export type PalMessageRow = {
  id: string;
  authorId: string;
  recipientId: string;
  type: "reflection" | "encouragement";
  body: string;
  verseReference?: string;
  createdAt: string;
};

function mapMessageRow(r: QueryResultRow): PalMessageRow {
  return {
    id: String(r.id),
    authorId: String(r.author_id),
    recipientId: String(r.recipient_id),
    type: (r.type === "encouragement" ? "encouragement" : "reflection") as PalMessageRow["type"],
    body: String(r.body || ""),
    verseReference: typeof r.verse_reference === "string" && r.verse_reference.trim() ? String(r.verse_reference) : undefined,
    createdAt: new Date(r.created_at as string).toISOString()
  };
}

export async function listPalMessages(userId: string, partnerId: string, limit = 50): Promise<PalMessageRow[]> {
  const { low, high } = orderedPair(userId, partnerId);
  const safeLimit = Math.min(200, Math.max(1, Math.floor(limit)));
  const res = await getPool().query(
    `SELECT id, author_id, recipient_id, type, body, verse_reference, created_at
     FROM pal_messages
     WHERE user_low = $1 AND user_high = $2
     ORDER BY created_at ASC
     LIMIT $3`,
    [low, high, safeLimit]
  );
  return res.rows.map(mapMessageRow);
}

export async function createPalMessage(params: {
  authorId: string;
  recipientId: string;
  type: "reflection" | "encouragement";
  body: string;
  verseReference?: string;
}): Promise<PalMessageRow> {
  const { authorId, recipientId, type, body, verseReference } = params;
  const { low, high } = orderedPair(authorId, recipientId);
  const res = await getPool().query(
    `INSERT INTO pal_messages (user_low, user_high, author_id, recipient_id, type, body, verse_reference, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, ''), NOW())
     RETURNING id, author_id, recipient_id, type, body, verse_reference, created_at`,
    [low, high, authorId, recipientId, type, body, verseReference?.trim() ?? ""]
  );
  const row = res.rows[0];
  if (!row) throw new Error("pal_messages insert failed");
  return mapMessageRow(row);
}

export type PalSharedGoalRow = {
  id: string;
  partnerId: string;
  targetSurahId: number;
  versesPerDay: number;
  daysPerWeek: number;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
};

function mapSharedGoalRow(r: QueryResultRow): PalSharedGoalRow {
  return {
    id: `shared-goal:${String(r.user_low)}:${String(r.user_high)}`,
    partnerId: String(r.partner_id),
    targetSurahId: Number(r.target_surah_id),
    versesPerDay: Number(r.verses_per_day),
    daysPerWeek: Number(r.days_per_week),
    targetDate: typeof r.target_date === "string" && r.target_date ? r.target_date : undefined,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString()
  };
}

export async function listPalSharedGoals(userId: string): Promise<PalSharedGoalRow[]> {
  const res = await getPool().query(
    `SELECT
       user_low,
       user_high,
       CASE WHEN user_low = $1 THEN user_high ELSE user_low END AS partner_id,
       target_surah_id,
       verses_per_day,
       days_per_week,
       target_date::text AS target_date,
       created_at,
       updated_at
     FROM pal_shared_goals
     WHERE user_low = $1 OR user_high = $1
     ORDER BY updated_at DESC`,
    [userId]
  );
  return res.rows.map(mapSharedGoalRow);
}

export async function upsertPalSharedGoal(params: {
  userId: string;
  partnerId: string;
  targetSurahId: number;
  versesPerDay: number;
  daysPerWeek: number;
  targetDate?: string;
}): Promise<PalSharedGoalRow> {
  const { userId, partnerId, targetSurahId, versesPerDay, daysPerWeek, targetDate } = params;
  const { low, high } = orderedPair(userId, partnerId);
  const res = await getPool().query(
    `INSERT INTO pal_shared_goals (
       user_low, user_high, created_by, target_surah_id, verses_per_day, days_per_week, target_date, created_at, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, '')::date, NOW(), NOW())
     ON CONFLICT (user_low, user_high)
     DO UPDATE SET
       created_by = EXCLUDED.created_by,
       target_surah_id = EXCLUDED.target_surah_id,
       verses_per_day = EXCLUDED.verses_per_day,
       days_per_week = EXCLUDED.days_per_week,
       target_date = EXCLUDED.target_date,
       updated_at = NOW()
     RETURNING
       user_low,
       user_high,
       CASE WHEN user_low = $3 THEN user_high ELSE user_low END AS partner_id,
       target_surah_id,
       verses_per_day,
       days_per_week,
       target_date::text AS target_date,
       created_at,
       updated_at`,
    [low, high, userId, targetSurahId, versesPerDay, daysPerWeek, targetDate?.trim() ?? ""]
  );
  const row = res.rows[0];
  if (!row) throw new Error("pal_shared_goals upsert failed");
  return mapSharedGoalRow(row);
}

export type PalReadingProgressRow = {
  userId: string;
  targetSurahId: number;
  versesReadWeek: number;
  totalVersesRead: number;
  weeklyGoal: number;
  streakDays: number;
  streakActive: boolean;
  updatedAt: string;
};

function mapReadingRow(r: QueryResultRow): PalReadingProgressRow {
  return {
    userId: String(r.user_id),
    targetSurahId: Number(r.target_surah_id),
    versesReadWeek: Number(r.verses_read_week),
    totalVersesRead: Number(r.total_verses_read),
    weeklyGoal: Number(r.weekly_goal),
    streakDays: Number(r.streak_days),
    streakActive: Boolean(r.streak_active),
    updatedAt: new Date(r.updated_at as string).toISOString()
  };
}

export async function getReadingProgress(userId: string): Promise<PalReadingProgressRow | null> {
  const res = await getPool().query(
    `SELECT user_id, target_surah_id, verses_read_week, total_verses_read, weekly_goal, streak_days, streak_active, updated_at
     FROM pal_reading_progress WHERE user_id = $1`,
    [userId]
  );
  const r = res.rows[0];
  return r ? mapReadingRow(r) : null;
}

export type ReadingProgressPatch = Partial<{
  targetSurahId: number;
  versesReadWeek: number;
  totalVersesRead: number;
  weeklyGoal: number;
  streakDays: number;
  streakActive: boolean;
}>;

export async function upsertReadingProgress(userId: string, patch: ReadingProgressPatch): Promise<PalReadingProgressRow> {
  const existing = await getReadingProgress(userId);
  const targetSurahId = patch.targetSurahId ?? existing?.targetSurahId ?? 1;
  const versesReadWeek = patch.versesReadWeek ?? existing?.versesReadWeek ?? 0;
  const totalVersesRead = patch.totalVersesRead ?? existing?.totalVersesRead ?? 0;
  const weeklyGoal = patch.weeklyGoal ?? existing?.weeklyGoal ?? 100;
  const streakDays = patch.streakDays ?? existing?.streakDays ?? 0;
  const streakActive = patch.streakActive ?? existing?.streakActive ?? true;

  await getPool().query(
    `INSERT INTO pal_reading_progress (user_id, target_surah_id, verses_read_week, total_verses_read, weekly_goal, streak_days, streak_active, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       target_surah_id = EXCLUDED.target_surah_id,
       verses_read_week = EXCLUDED.verses_read_week,
       total_verses_read = EXCLUDED.total_verses_read,
       weekly_goal = EXCLUDED.weekly_goal,
       streak_days = EXCLUDED.streak_days,
       streak_active = EXCLUDED.streak_active,
       updated_at = NOW()`,
    [userId, targetSurahId, versesReadWeek, totalVersesRead, weeklyGoal, streakDays, streakActive]
  );
  const row = await getReadingProgress(userId);
  if (!row) throw new Error("pal_reading_progress upsert failed");
  return row;
}
