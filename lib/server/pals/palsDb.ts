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

function initialsFromDisplayName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "P";
  const first = words[0]?.[0] ?? "";
  const second = words.length > 1 ? words[1]?.[0] ?? "" : "";
  return `${first}${second}`.toUpperCase() || "P";
}

function messagePreview(body: string, limit = 88): string {
  const trimmed = body.trim().replace(/\s+/g, " ");
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, Math.max(0, limit - 1)).trimEnd()}...`;
}

function isoDateDaysAgo(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
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

export type UserProfileRow = {
  userId: string;
  displayName: string;
  updatedAt: string;
};

function mapUserProfileRow(r: QueryResultRow): UserProfileRow {
  return {
    userId: String(r.user_id),
    displayName: String(r.display_name),
    updatedAt: new Date(r.updated_at as string).toISOString()
  };
}

export async function getUserProfile(userId: string): Promise<UserProfileRow | null> {
  const res = await getPool().query(
    `SELECT user_id, display_name, updated_at
     FROM user_profiles
     WHERE user_id = $1
     LIMIT 1`,
    [userId]
  );
  const row = res.rows[0];
  return row ? mapUserProfileRow(row) : null;
}

export async function upsertUserProfile(userId: string, displayName: string): Promise<UserProfileRow> {
  const res = await getPool().query(
    `INSERT INTO user_profiles (user_id, display_name, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       display_name = EXCLUDED.display_name,
       updated_at = NOW()
     RETURNING user_id, display_name, updated_at`,
    [userId, displayName.trim()]
  );
  const row = res.rows[0];
  if (!row) throw new Error("user_profiles upsert failed");
  return mapUserProfileRow(row);
}

export async function renameUserInPalLinks(userId: string, displayName: string): Promise<void> {
  const trimmed = displayName.trim();
  await Promise.all([
    getPool().query("UPDATE pal_links SET low_display_name = $2, updated_at = NOW() WHERE user_low = $1", [userId, trimmed]),
    getPool().query("UPDATE pal_links SET high_display_name = $2, updated_at = NOW() WHERE user_high = $1", [userId, trimmed])
  ]);
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

export type PalUnreadThreadRow = {
  partnerId: string;
  displayName: string;
  unreadCount: number;
  latestMessageId?: string;
  latestMessagePreview?: string;
  latestMessageType?: "reflection" | "encouragement";
  latestMessageAt?: string;
  senderInitials: string;
};

function mapUnreadThreadRow(r: QueryResultRow): PalUnreadThreadRow {
  const displayName = String(r.display_name || "Partner");
  return {
    partnerId: String(r.partner_id),
    displayName,
    unreadCount: Number(r.unread_count || 0),
    latestMessageId: typeof r.latest_message_id === "string" ? r.latest_message_id : String(r.latest_message_id ?? ""),
    latestMessagePreview: typeof r.latest_message_body === "string" ? messagePreview(String(r.latest_message_body)) : undefined,
    latestMessageType: (r.latest_message_type === "encouragement" ? "encouragement" : "reflection") as
      | "reflection"
      | "encouragement",
    latestMessageAt: r.latest_message_at ? new Date(r.latest_message_at as string).toISOString() : undefined,
    senderInitials: initialsFromDisplayName(displayName)
  };
}

export async function listPalUnreadThreads(userId: string): Promise<PalUnreadThreadRow[]> {
  const res = await getPool().query(
    `WITH unread AS (
       SELECT
         m.author_id AS partner_id,
         m.id AS latest_message_id,
         m.type AS latest_message_type,
         m.body AS latest_message_body,
         m.created_at AS latest_message_at,
         ROW_NUMBER() OVER (PARTITION BY m.author_id ORDER BY m.created_at DESC, m.id DESC) AS row_num,
         COUNT(*) OVER (PARTITION BY m.author_id) AS unread_count
       FROM pal_messages m
       LEFT JOIN pal_message_reads r
         ON r.user_low = m.user_low
        AND r.user_high = m.user_high
        AND r.user_id = $1
       WHERE m.recipient_id = $1
         AND m.author_id <> $1
         AND m.created_at > COALESCE(r.last_read_at, TO_TIMESTAMP(0))
     )
     SELECT
       u.partner_id,
       COALESCE(
         CASE
           WHEN pl.user_low = $1 THEN pl.high_display_name
           WHEN pl.user_high = $1 THEN pl.low_display_name
           ELSE NULL
         END,
         'Partner'
       ) AS display_name,
       u.unread_count,
       u.latest_message_id,
       u.latest_message_type,
       u.latest_message_body,
       u.latest_message_at
     FROM unread u
     LEFT JOIN pal_links pl
       ON (pl.user_low = $1 AND pl.user_high = u.partner_id)
       OR (pl.user_high = $1 AND pl.user_low = u.partner_id)
     WHERE u.row_num = 1
     ORDER BY u.latest_message_at DESC, u.latest_message_id DESC`,
    [userId]
  );
  return res.rows.map(mapUnreadThreadRow);
}

export async function markPalThreadRead(userId: string, partnerId: string): Promise<void> {
  const { low, high } = orderedPair(userId, partnerId);
  await getPool().query(
    `WITH latest AS (
       SELECT id, created_at
       FROM pal_messages
       WHERE user_low = $1 AND user_high = $2
       ORDER BY created_at DESC, id DESC
       LIMIT 1
     )
     INSERT INTO pal_message_reads (
       user_low,
       user_high,
       user_id,
       last_read_at,
       last_read_message_id,
       created_at,
       updated_at
     )
     VALUES (
       $1,
       $2,
       $3,
       COALESCE((SELECT created_at FROM latest), NOW()),
       (SELECT id FROM latest),
       NOW(),
       NOW()
     )
     ON CONFLICT (user_low, user_high, user_id)
     DO UPDATE SET
       last_read_at = GREATEST(pal_message_reads.last_read_at, EXCLUDED.last_read_at),
       last_read_message_id = COALESCE(EXCLUDED.last_read_message_id, pal_message_reads.last_read_message_id),
       updated_at = NOW()`,
    [low, high, userId]
  );
}

export type PushSubscriptionRow = {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
};

function mapPushSubscriptionRow(r: QueryResultRow): PushSubscriptionRow {
  return {
    userId: String(r.user_id),
    endpoint: String(r.endpoint),
    p256dh: String(r.p256dh),
    auth: String(r.auth),
    userAgent: typeof r.user_agent === "string" && r.user_agent.trim() ? String(r.user_agent) : undefined,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
    lastSeenAt: new Date(r.last_seen_at as string).toISOString()
  };
}

export async function listPushSubscriptions(userId: string): Promise<PushSubscriptionRow[]> {
  const res = await getPool().query(
    `SELECT user_id, endpoint, p256dh, auth, user_agent, created_at, updated_at, last_seen_at
     FROM push_subscriptions
     WHERE user_id = $1
     ORDER BY updated_at DESC`,
    [userId]
  );
  return res.rows.map(mapPushSubscriptionRow);
}

export async function upsertPushSubscription(params: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}): Promise<PushSubscriptionRow> {
  const { userId, endpoint, p256dh, auth, userAgent } = params;
  const res = await getPool().query(
    `INSERT INTO push_subscriptions (endpoint, user_id, p256dh, auth, user_agent, created_at, updated_at, last_seen_at)
     VALUES ($1, $2, $3, $4, NULLIF($5, ''), NOW(), NOW(), NOW())
     ON CONFLICT (endpoint)
     DO UPDATE SET
       user_id = EXCLUDED.user_id,
       p256dh = EXCLUDED.p256dh,
       auth = EXCLUDED.auth,
       user_agent = EXCLUDED.user_agent,
       updated_at = NOW(),
       last_seen_at = NOW()
     RETURNING user_id, endpoint, p256dh, auth, user_agent, created_at, updated_at, last_seen_at`,
    [endpoint, userId, p256dh, auth, userAgent?.trim() ?? ""]
  );
  const row = res.rows[0];
  if (!row) throw new Error("push_subscriptions upsert failed");
  return mapPushSubscriptionRow(row);
}

export async function deletePushSubscription(userId: string, endpoint: string): Promise<void> {
  await getPool().query("DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2", [userId, endpoint]);
}

export async function deletePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
  await getPool().query("DELETE FROM push_subscriptions WHERE endpoint = $1", [endpoint]);
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
  lastVerseActivityDate?: string;
  updatedAt: string;
};

function mapReadingRow(r: QueryResultRow, todayIsoDate?: string): PalReadingProgressRow {
  const lastVerseActivityDate = typeof r.last_verse_activity_date === "string" && r.last_verse_activity_date ? String(r.last_verse_activity_date) : undefined;
  const streakActive = !!lastVerseActivityDate && !!todayIsoDate && lastVerseActivityDate === todayIsoDate;
  return {
    userId: String(r.user_id),
    targetSurahId: Number(r.target_surah_id),
    versesReadWeek: Number(r.verses_read_week),
    totalVersesRead: Number(r.total_verses_read),
    weeklyGoal: Number(r.weekly_goal),
    streakDays: Number(r.streak_days),
    streakActive,
    lastVerseActivityDate,
    updatedAt: new Date(r.updated_at as string).toISOString()
  };
}

export async function getReadingProgress(userId: string, todayIsoDate?: string): Promise<PalReadingProgressRow | null> {
  const res = await getPool().query(
    `SELECT user_id, target_surah_id, verses_read_week, total_verses_read, weekly_goal, streak_days, streak_active, last_verse_activity_date::text AS last_verse_activity_date, updated_at
     FROM pal_reading_progress WHERE user_id = $1`,
    [userId]
  );
  const r = res.rows[0];
  return r ? mapReadingRow(r, todayIsoDate) : null;
}

export type ReadingProgressPatch = Partial<{
  targetSurahId: number;
  versesReadWeek: number;
  totalVersesRead: number;
  weeklyGoal: number;
}>;

export async function upsertReadingProgress(userId: string, patch: ReadingProgressPatch, todayIsoDate: string): Promise<PalReadingProgressRow> {
  const existing = await getReadingProgress(userId, todayIsoDate);
  const targetSurahId = patch.targetSurahId ?? existing?.targetSurahId ?? 1;
  const versesReadWeek = patch.versesReadWeek ?? existing?.versesReadWeek ?? 0;
  const totalVersesRead = patch.totalVersesRead ?? existing?.totalVersesRead ?? 0;
  const weeklyGoal = patch.weeklyGoal ?? existing?.weeklyGoal ?? 100;
  const lastVerseActivityDate = existing?.lastVerseActivityDate;
  const versesChanged =
    (typeof patch.versesReadWeek === "number" && patch.versesReadWeek !== (existing?.versesReadWeek ?? 0)) ||
    (typeof patch.totalVersesRead === "number" && patch.totalVersesRead !== (existing?.totalVersesRead ?? 0));
  let streakDays = existing?.streakDays ?? 0;
  let nextActivityDate = lastVerseActivityDate;

  if (versesChanged) {
    if (lastVerseActivityDate === todayIsoDate) {
      streakDays = Math.max(1, existing?.streakDays ?? 0);
    } else if (lastVerseActivityDate === isoDateDaysAgo(todayIsoDate, 1)) {
      streakDays = Math.max(1, existing?.streakDays ?? 0) + 1;
    } else {
      streakDays = 1;
    }
    nextActivityDate = todayIsoDate;
  }

  await getPool().query(
    `INSERT INTO pal_reading_progress (user_id, target_surah_id, verses_read_week, total_verses_read, weekly_goal, streak_days, streak_active, last_verse_activity_date, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NULLIF($8, '')::date, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       target_surah_id = EXCLUDED.target_surah_id,
       verses_read_week = EXCLUDED.verses_read_week,
       total_verses_read = EXCLUDED.total_verses_read,
       weekly_goal = EXCLUDED.weekly_goal,
       streak_days = EXCLUDED.streak_days,
       streak_active = EXCLUDED.streak_active,
       last_verse_activity_date = EXCLUDED.last_verse_activity_date,
       updated_at = NOW()`,
    [userId, targetSurahId, versesReadWeek, totalVersesRead, weeklyGoal, streakDays, nextActivityDate === todayIsoDate, nextActivityDate ?? ""]
  );
  const row = await getReadingProgress(userId, todayIsoDate);
  if (!row) throw new Error("pal_reading_progress upsert failed");
  return row;
}
