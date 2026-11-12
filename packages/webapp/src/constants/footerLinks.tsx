/**
 * RBooks footer links. The only link is the AGPL-3.0 "Code source" link,
 * shown when the server is configured with RBOOKS_SOURCE_URL.
 */
export const getFooterLinks = (
  sourceUrl?: string,
): Array<{ title: string; link: string }> =>
  sourceUrl ? [{ title: 'Code source', link: sourceUrl }] : [];
