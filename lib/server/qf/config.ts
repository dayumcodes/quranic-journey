export type QfEnv = "prelive" | "production";

const PRELIVE_AUTH = "https://prelive-oauth2.quran.foundation";
const PRELIVE_API = "https://apis-prelive.quran.foundation";
const PROD_AUTH = "https://oauth2.quran.foundation";
const PROD_API = "https://apis.quran.foundation";

export function getQfServerConfig(): {
  env: QfEnv;
  authBaseUrl: string;
  apiBaseUrl: string;
  clientId: string;
  clientSecret: string;
} {
  const envRaw = process.env.QF_ENV?.toLowerCase();
  const env: QfEnv = envRaw === "production" ? "production" : "prelive";

  const authBaseUrl = process.env.QF_AUTH_BASE_URL?.trim() || (env === "production" ? PROD_AUTH : PRELIVE_AUTH);
  const apiBaseUrl = process.env.QF_API_BASE_URL?.trim() || (env === "production" ? PROD_API : PRELIVE_API);

  const clientId = process.env.QF_CLIENT_ID?.trim();
  const clientSecret = process.env.QF_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing QF_CLIENT_ID or QF_CLIENT_SECRET — set Quran Foundation Content API credentials (server-side only)."
    );
  }

  return { env, authBaseUrl, apiBaseUrl, clientId, clientSecret };
}
