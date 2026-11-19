import { registerAs } from '@nestjs/config';

/**
 * NBooks specific settings.
 * `sourceUrl` is the public URL of the corresponding source code (AGPL-3.0, section 13).
 * An empty value hides the "Code source" link in the interface.
 */
export default registerAs('rbooks', () => ({
  // NBOOKS_SOURCE_URL d'abord ; RBOOKS_SOURCE_URL reste accepté (anciens fichiers .env).
  sourceUrl: (process.env.NBOOKS_SOURCE_URL || process.env.RBOOKS_SOURCE_URL || '').trim(),
}));
