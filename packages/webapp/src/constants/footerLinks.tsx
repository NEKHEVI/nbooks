/**
 * NBooks footer links. The only link is the AGPL-3.0 "Code source" link,
 * shown when the server is configured with NBOOKS_SOURCE_URL (or the older RBOOKS_SOURCE_URL).
 */
export const getFooterLinks = (
  sourceUrl?: string,
): Array<{ title: string; link: string }> =>
  sourceUrl ? [{ title: 'Code source', link: sourceUrl }] : [];
