/**
 * Parses a comma-separated origin allowlist. Returns `false` (CORS off) when
 * the value is unset or lists no origin, so a missing variable never opens
 * the API to every origin. Throws on an entry that is not a bare origin
 * (`http://localhost:5173/` would silently never match).
 */
export function parseCorsOrigins(value: string | undefined): string[] | false {
  const origins = (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  for (const origin of origins) {
    if (!isBareOrigin(origin)) {
      throw new Error(
        `Invalid CORS origin "${origin}": expected scheme://host[:port] with no path or trailing slash.`,
      );
    }
  }

  return origins.length > 0 ? origins : false;
}

function isBareOrigin(value: string): boolean {
  return URL.canParse(value) && new URL(value).origin === value;
}
