export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  hizb_number: number;
  juz_number: number;
  text_uthmani: string;
  translations: Translation[];
  tafsirs: Tafsir[];
  words: Word[];
}
export interface Word {
  id: number;
  position: number;
  text_uthmani: string;
  translation: { text: string; language_name: string };
}
export interface Translation { id: number; resource_id: number; text: string; }
export interface Tafsir { id: number; resource_id: number; text: string; }
export interface AudioRecitation { verse_key: string; url: string; }
export interface Chapter {
  id: number;
  name_arabic: string;
  name_simple: string;
  translated_name: { name: string; language_name: string };
  verses_count: number;
}
export interface StreakData { streak_count: number; longest_streak: number; days_active: string[]; }
export interface Goal {
  id: string;
  type: "personal" | "shared";
  target_surah_id: number;
  verses_per_day: number;
  days_per_week: number;
  partner_id?: string;
  target_date?: string;
  progress: GoalProgress;
}
export interface GoalProgress { user_percentage: number; partner_percentage?: number; }
export interface ActivitySession {
  id: string;
  type: "listening" | "reading" | "reading_speed_calibration";
  verse_key?: string;
  wpm?: number;
  duration_seconds?: number;
  created_at: string;
}
export interface Collection { id: string; name: string; items: CollectionItem[]; }
export interface CollectionItem {
  id: string;
  verse_key: string;
  note?: string;
  location_context?: string;
  badge_id?: string;
  earned_at?: string;
  saved_at: string;
}
export interface Post {
  id: string;
  type: "reflection" | "encouragement";
  author_id: string;
  recipient_id?: string;
  body: string;
  verse_reference?: string;
  created_at: string;
}
export interface User { id: string; name: string; email: string; avatar_initials: string; }
export interface PartnerProfile {
  user: User;
  streak: StreakData;
  current_surah: Chapter;
  is_online: boolean;
  last_seen: string;
  wpm: number;
}
export interface MCPSearchResult {
  verse_key: string;
  text_arabic: string;
  translation: string;
  surah_name: string;
  ayah_number: number;
  relevance_score: number;
}
export interface LocationClassification { label: string; icon: string; keywords: string; contextTag: string; }
export interface NominatimResult {
  address: {
    amenity?: string;
    building?: string;
    shop?: string;
    place?: string;
    road?: string;
    suburb?: string;
    city?: string;
    country?: string;
  };
}
export interface ApiError { status: number; message: string; }
export type LocationState = "IDLE" | "DETECTING" | "DETECTED" | "DENIED" | "ERROR";
export type PanelState = "PLAYER" | "QUIZ" | "BADGE";
export type NavPage = "home" | "journey" | "reflect" | "pal";
