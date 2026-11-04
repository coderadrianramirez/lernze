export type ProfileLink = { url: string; platform: string; host: string; social: boolean };
const platforms: Record<string, string> = {
  "instagram.com": "Instagram", "linkedin.com": "LinkedIn", "tiktok.com": "TikTok",
  "x.com": "X", "twitter.com": "X", "facebook.com": "Facebook", "youtube.com": "YouTube", "youtu.be": "YouTube",
};
export function profileLink(value: unknown): ProfileLink | null {
  if (typeof value !== "string" || value.length > 500 || /[\s\\\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (url.protocol !== "https:" || url.username || url.password || url.port ||
        !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(host) ||
        /\.(localhost|local|internal|test|invalid)$/.test(host)) return null;
    const redirects = /(?:^|\/)(?:redirect|redir|l\.php|linkshim)(?:\/|$)/i.test(url.pathname) || [...url.searchParams.keys()].some(key => /^(url|u|q|redirect|redirect_uri|link|target|continue|return_to|href)$/i.test(key));
    const platform = redirects ? undefined : platforms[host];
    return { url: url.href, host, platform: platform ?? "Sitio web", social: Boolean(platform) };
  } catch { return null; }
}
export function parseProfileLinks(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 6) throw Error("Puedes añadir hasta seis enlaces.");
  const links = value.map(item => profileLink(item));
  if (links.some(link => !link)) throw Error("Usa enlaces completos con https://, sin contraseñas ni direcciones locales.");
  const urls = links.map(link => link!.url);
  if (new Set(urls).size !== urls.length) throw Error("Hay enlaces repetidos. Conserva solo uno de cada dirección.");
  return urls;
}
