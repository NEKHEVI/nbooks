// NBooks: guards the French (fr-CA) translations against drift from English.
import * as fs from 'fs';
import * as path from 'path';

const I18N_DIR = path.join(__dirname);
const WEBAPP_LANG_DIR = path.join(__dirname, '../../../webapp/src/lang');

const keysOf = (obj: any, prefix = ''): string[] =>
  Object.keys(obj).flatMap((key) =>
    obj[key] && typeof obj[key] === 'object'
      ? keysOf(obj[key], `${prefix}${key}/`)
      : [`${prefix}${key}`],
  );

const tokensOf = (value: string): string =>
  (value.match(/\{\{?[^}]+\}\}?|<[^>]+>/g) || []).sort().join('|');

const flatten = (obj: any, prefix = ''): Record<string, string> =>
  Object.keys(obj).reduce(
    (acc, key) => {
      const value = obj[key];
      if (value && typeof value === 'object') {
        Object.assign(acc, flatten(value, `${prefix}${key}/`));
      } else {
        acc[`${prefix}${key}`] = String(value);
      }
      return acc;
    },
    {} as Record<string, string>,
  );

const readJson = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'));

describe('i18n: French (fr) server translations', () => {
  const enFiles = fs.readdirSync(path.join(I18N_DIR, 'en')).sort();
  const frFiles = fs.readdirSync(path.join(I18N_DIR, 'fr')).sort();

  it('has the same files as English', () => {
    expect(frFiles).toEqual(enFiles);
  });

  it.each(enFiles)('%s has the same keys and variables as English', (file) => {
    const en = flatten(readJson(path.join(I18N_DIR, 'en', file)));
    const fr = flatten(readJson(path.join(I18N_DIR, 'fr', file)));

    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
    Object.keys(en).forEach((key) => {
      expect(tokensOf(fr[key])).toEqual(tokensOf(en[key]));
    });
  });
});

describe('i18n: French (fr) webapp translations', () => {
  const en = readJson(path.join(WEBAPP_LANG_DIR, 'en', 'index.json'));
  const fr = readJson(path.join(WEBAPP_LANG_DIR, 'fr', 'index.json'));

  it('has exactly the same keys as English', () => {
    expect(keysOf(fr).sort()).toEqual(keysOf(en).sort());
  });

  it('keeps the interpolation variables and HTML tags of English', () => {
    const flatEn = flatten(en);
    const flatFr = flatten(fr);
    Object.keys(flatEn).forEach((key) => {
      expect(tokensOf(flatFr[key])).toEqual(tokensOf(flatEn[key]));
    });
  });
});
