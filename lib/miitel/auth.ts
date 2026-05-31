/**
 * MiiTel Open API のアクセストークンを取得・キャッシュするヘルパー。
 *
 * アクセストークンには有効期限があるため、静的トークンを .env に
 * ベタ書きすると 401 になる。ここでは access_key から authenticate して
 * トークンを取得し、メモリにキャッシュ、期限が近づいたら自動で取り直す。
 *
 * ⚠️ authenticate のエンドポイント/パラメータ名/レスポンス形式は
 *    MiiTel 公式リファレンスで要確認（テナント・APIバージョンで差あり）。
 *    違っていたら下の TODO 箇所を1〜数行直すだけで動くように分離してある。
 *    docs: https://developers.miitel.com/reference/authenticateauthenticationauthentication
 */

interface CachedToken {
  token: string;
  /** epoch ms。この時刻を過ぎたら取り直す。 */
  expiresAt: number;
}

let cache: CachedToken | null = null;

/** 期限切れ判定の安全マージン（秒）。期限の60秒前には更新する。 */
const EXPIRY_MARGIN_SEC = 60;

export function hasMiitelCredentials(): boolean {
  return Boolean(
    process.env.MIITEL_COMPANY_ID &&
      process.env.MIITEL_ACCESS_KEY_ID &&
      process.env.MIITEL_ACCESS_KEY_SECRET,
  );
}

/**
 * 使えるトークンを返す。
 * 優先順位:
 *   1) MIITEL_MCP_TOKEN（静的トークンが直接指定されていればそれを使う）
 *   2) access_key から authenticate して取得（推奨・自動更新される）
 */
export async function getMiitelToken(): Promise<string> {
  const staticToken = process.env.MIITEL_MCP_TOKEN;
  if (staticToken) return staticToken;

  // キャッシュが有効ならそれを使う
  const now = Date.now();
  if (cache && cache.expiresAt - EXPIRY_MARGIN_SEC * 1000 > now) {
    return cache.token;
  }

  cache = await authenticate();
  return cache.token;
}

async function authenticate(): Promise<CachedToken> {
  const authUrl =
    process.env.MIITEL_AUTH_URL ??
    "https://api.miitel.com/api/auth/v2/authenticate"; // TODO: 正しいベースURLを公式で確認
  const companyId = process.env.MIITEL_COMPANY_ID;
  const accessKeyId = process.env.MIITEL_ACCESS_KEY_ID;
  const accessKeySecret = process.env.MIITEL_ACCESS_KEY_SECRET;

  if (!companyId || !accessKeyId || !accessKeySecret) {
    throw new Error(
      "MiiTel 認証情報が不足しています。MIITEL_MCP_TOKEN を直接指定するか、" +
        "MIITEL_COMPANY_ID / MIITEL_ACCESS_KEY_ID / MIITEL_ACCESS_KEY_SECRET を設定してください。",
    );
  }

  const res = await fetch(authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // TODO: パラメータ名は公式リファレンスに合わせて調整
    body: JSON.stringify({
      company_id: companyId,
      access_key_id: accessKeyId,
      access_key_secret: accessKeySecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `MiiTel authenticate に失敗しました (HTTP ${res.status}). ${text}`,
    );
  }

  const data = (await res.json()) as {
    access_token?: string;
    token?: string;
    expires_in?: number; // 秒
  };

  // TODO: レスポンスのフィールド名は公式に合わせて調整
  const token = data.access_token ?? data.token;
  if (!token) {
    throw new Error(
      "authenticate のレスポンスにトークンが見つかりませんでした。フィールド名を確認してください。",
    );
  }

  const expiresInSec = data.expires_in ?? 3600; // 不明なら1時間とみなす
  return { token, expiresAt: Date.now() + expiresInSec * 1000 };
}
