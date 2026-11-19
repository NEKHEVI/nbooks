/**
 * Thèmes d'habillage NBooks, mêmes noms et même logique que l'app NEKHEVI
 * (src/lib/nk-theme.ts de NEKHEVI) : indépendants du mode clair / sombre.
 *
 *  - editorial  : « Éditorial noir » (grand chiffre à empattements, filets, sans cartes)
 *  - instrument : « Instrument » (chiffres en chasse fixe, grille fine, touches physiques), défaut
 *  - verre      : « Verre et lumière » (verre dépoli, lumière or derrière)
 *  - bento      : « Bento audacieux » (tuiles, touche principale crème)
 *
 * Posé sur <html data-nk-theme="..."> par public/preload-theme.js avant le premier rendu
 * (aucun flash), puis par setNkTheme(). Jetons : src/style/nbooks-theme.scss.
 * NBooks est une application monopage : le choix est gardé dans localStorage (clé « nk-theme »),
 * et le mode dans la clé « theme » (« light » ou « dark ») déjà lue par Bigcapital.
 */
export const NK_THEMES = ['editorial', 'instrument', 'verre', 'bento'] as const;
export type NkTheme = (typeof NK_THEMES)[number];
export const NK_THEME_STORAGE_KEY = 'nk-theme';
export const DEFAULT_NK_THEME: NkTheme = 'instrument';

export type NkMode = 'light' | 'dark';
export const NK_MODE_STORAGE_KEY = 'theme';
export const NK_THEME_EVENT = 'nk-theme-change';

/** Thème enregistré ; toute valeur inconnue retombe sur « instrument ». */
export function resolveNkTheme(value: string | null | undefined): NkTheme {
  return (NK_THEMES as readonly string[]).includes(value ?? '')
    ? (value as NkTheme)
    : DEFAULT_NK_THEME;
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Navigation privée ou stockage bloqué : le choix vaut pour la session seulement.
  }
}

export function getNkTheme(): NkTheme {
  return resolveNkTheme(
    document.documentElement.getAttribute('data-nk-theme') ??
      readStorage(NK_THEME_STORAGE_KEY),
  );
}

export function getNkMode(): NkMode {
  return document.body.classList.contains('bp4-dark') ? 'dark' : 'light';
}

function notify() {
  window.dispatchEvent(
    new CustomEvent(NK_THEME_EVENT, {
      detail: { theme: getNkTheme(), mode: getNkMode() },
    }),
  );
}

export function setNkTheme(theme: NkTheme) {
  const value = resolveNkTheme(theme);
  document.documentElement.setAttribute('data-nk-theme', value);
  writeStorage(NK_THEME_STORAGE_KEY, value);
  notify();
}

/** Mode clair / sombre : classe bp4-dark sur html ET body (Blueprint et Bigcapital). */
export function setNkMode(mode: NkMode) {
  const dark = mode === 'dark';
  document.documentElement.classList.toggle('bp4-dark', dark);
  document.body.classList.toggle('bp4-dark', dark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#0B0B0C' : '#F5F4F1');
  writeStorage(NK_MODE_STORAGE_KEY, mode);
  notify();
}

export function toggleNkMode() {
  setNkMode(getNkMode() === 'dark' ? 'light' : 'dark');
}
