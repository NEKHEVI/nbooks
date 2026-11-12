import { registerAs } from '@nestjs/config';

/**
 * RBooks specific settings.
 * `sourceUrl` is the public URL of the corresponding source code (AGPL-3.0, section 13).
 * An empty value hides the "Code source" link in the interface.
 */
export default registerAs('rbooks', () => ({
  sourceUrl: (process.env.RBOOKS_SOURCE_URL || '').trim(),
}));
