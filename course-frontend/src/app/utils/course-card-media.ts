/** Matches backend `thumbnailHelper` API origin usage in this app. */
const API_ORIGIN = 'https://coursehub-production-b7b9.up.railway.app';

export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  if (!/(youtube\.com|youtu\.be)/i.test(u)) return null;
  const short = u.match(/youtu\.be\/([^/?&#]+)/i);
  if (short?.[1]) return short[1];
  const watch = u.match(/[?&]v=([^/?&#]+)/i);
  if (watch?.[1]) return watch[1];
  const embed = u.match(/youtube\.com\/embed\/([^/?&#]+)/i);
  if (embed?.[1]) return embed[1];
  const shorts = u.match(/youtube\.com\/shorts\/([^/?&#]+)/i);
  if (shorts?.[1]) return shorts[1];
  return null;
}

function resolveThumbnailSource(raw: string): string | null {
  const t = String(raw).trim();
  if (!t) return null;
  if (t.startsWith('data:image/')) return t;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('/')) return API_ORIGIN + t;
  return API_ORIGIN + '/' + t.replace(/^\/+/, '');
}

/**
 * Public tutorials / course cards: explicit thumbnail (upload or URL) if set,
 * else YouTube still (hqdefault) from `video_link`, else no image.
 */
export function getTutorialCardImageUrl(course: any): string | null {
  if (!course) return null;

  const tf = course.thumbnail_file;
  if (tf != null && String(tf).trim() !== '') {
    const t = String(tf).trim();
    if (t.startsWith('data:image/')) return t;
    if (/^https?:\/\//i.test(t)) return t;
    return API_ORIGIN + (t.startsWith('/') ? t : '/' + t);
  }

  for (const key of ['thumbnail_url', 'thumbnailUrl', 'image'] as const) {
    const v = course[key];
    if (v == null || String(v).trim() === '') continue;
    const resolved = resolveThumbnailSource(String(v));
    if (resolved) return resolved;
  }

  const vid = extractYouTubeVideoId(String(course.video_link || course.videoLink || ''));
  if (vid) return `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;

  return null;
}
