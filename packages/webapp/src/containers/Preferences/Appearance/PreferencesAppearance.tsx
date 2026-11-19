import * as FF from 'fp-ts/function';
import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import {
  withDashboardActions,
  type WithDashboardActionsProps,
} from '@/containers/Dashboard/withDashboardActions';
import {
  NK_THEMES,
  NK_THEME_EVENT,
  getNkMode,
  getNkTheme,
  setNkMode,
  setNkTheme,
  type NkMode,
  type NkTheme,
} from '@/theme/nkTheme';
import './PreferencesAppearance.scss';

/** Couleurs d'aperçu (fixes) : une vignette par thème, dans le mode courant. */
const PREVIEW: Record<NkTheme, Record<NkMode, { bg: string; surface: string; fg: string; muted: string; accent: string; line: string }>> = {
  editorial: {
    dark: { bg: '#0A0A0A', surface: '#0F0F0E', fg: '#F4F1EA', muted: '#9C988F', accent: '#DEA543', line: '#24221F' },
    light: { bg: '#F6F3EC', surface: '#FFFDF8', fg: '#14120F', muted: '#5C574F', accent: '#B57C1D', line: '#E1DACB' },
  },
  instrument: {
    dark: { bg: '#09090A', surface: '#121213', fg: '#F4F3EF', muted: '#9B9DA2', accent: '#DEA543', line: '#242426' },
    light: { bg: '#F3F3F1', surface: '#FFFFFF', fg: '#111113', muted: '#55565B', accent: '#B57C1D', line: '#DEDEDA' },
  },
  verre: {
    dark: { bg: '#090705', surface: 'rgba(255,238,205,0.07)', fg: '#FBF7EF', muted: '#ADA18D', accent: '#DEA543', line: 'rgba(255,226,166,0.16)' },
    light: { bg: '#F6EFE3', surface: 'rgba(255,252,245,0.7)', fg: '#17120A', muted: '#5E5242', accent: '#B57C1D', line: 'rgba(120,86,30,0.18)' },
  },
  bento: {
    dark: { bg: '#0B0A08', surface: '#181714', fg: '#F6F3EC', muted: '#A29C90', accent: '#DEA543', line: 'transparent' },
    light: { bg: '#F2EDE3', surface: '#FFFFFF', fg: '#141210', muted: '#5A544A', accent: '#AF771B', line: 'transparent' },
  },
};

const FONT: Record<NkTheme, string> = {
  editorial: "'Instrument Serif', Georgia, serif",
  instrument: "'Geist Mono Variable', ui-monospace, monospace",
  verre: "'Geist Variable', system-ui, sans-serif",
  bento: "'Bricolage Grotesque Variable', 'Geist Variable', sans-serif",
};

function useNkState() {
  const [state, setState] = useState(() => ({ theme: getNkTheme(), mode: getNkMode() }));
  useEffect(() => {
    const onChange = () => setState({ theme: getNkTheme(), mode: getNkMode() });
    window.addEventListener(NK_THEME_EVENT, onChange);
    return () => window.removeEventListener(NK_THEME_EVENT, onChange);
  }, []);
  return state;
}

function ThemeCard({ theme, active, mode }: { theme: NkTheme; active: boolean; mode: NkMode }) {
  const c = PREVIEW[theme][mode];
  const hero = theme === 'bento';
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      className={`nb-appearance__card${active ? ' is-active' : ''}`}
      onClick={() => setNkTheme(theme)}
      data-testid={`nb-theme-${theme}`}
    >
      <span className="nb-appearance__preview" style={{ background: c.bg }} aria-hidden="true">
        {theme === 'verre' && (
          <span className="nb-appearance__glow" style={{ background: `radial-gradient(60% 70% at 70% 20%, ${c.accent}55, transparent 70%)` }} />
        )}
        <span className="nb-appearance__side" style={{ background: c.surface, borderColor: c.line }} />
        <span
          className="nb-appearance__hero"
          style={{
            background: hero ? c.accent : theme === 'editorial' ? 'transparent' : c.surface,
            borderColor: theme === 'editorial' ? c.line : c.line,
            borderRadius: theme === 'editorial' ? 0 : theme === 'instrument' ? 5 : 10,
          }}
        >
          <span className="nb-appearance__label" style={{ color: hero ? '#141009' : c.muted }}>
            {intl.get('nbooks.appearance.sample')}
          </span>
          <span className="nb-appearance__figure" style={{ color: hero ? '#141009' : c.fg, fontFamily: FONT[theme] }}>
            11 783 $
          </span>
          <svg className="nb-appearance__line" viewBox="0 0 100 24" preserveAspectRatio="none">
            <polyline
              points="0,20 14,17 28,18 42,12 56,14 70,8 84,9 100,3"
              fill="none"
              stroke={hero ? '#141009' : c.accent}
              strokeWidth="1.6"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </span>
      </span>
      <span className="nb-appearance__meta">
        <span className="nb-appearance__name">{intl.get(`nbooks.theme.${theme}.name`)}</span>
        <span className="nb-appearance__state">
          {active ? intl.get('nbooks.appearance.active') : intl.get('nbooks.appearance.choose')}
        </span>
      </span>
      <span className="nb-appearance__tagline">{intl.get(`nbooks.theme.${theme}.tagline`)}</span>
    </button>
  );
}

type Props = Pick<WithDashboardActionsProps, 'changePreferencesPageTitle'>;

function PreferencesAppearanceInner({ changePreferencesPageTitle }: Props) {
  const { theme, mode } = useNkState();

  useEffect(() => {
    changePreferencesPageTitle(intl.get('nbooks.appearance.title'));
  }, [changePreferencesPageTitle]);

  return (
    <div className="nb-appearance">
      <section className="nb-appearance__section">
        <h2 className="nb-appearance__h">{intl.get('nbooks.appearance.theme_label')}</h2>
        <p className="nb-appearance__help">{intl.get('nbooks.appearance.theme_help')}</p>
        <div className="nb-appearance__grid" role="radiogroup" aria-label={intl.get('nbooks.appearance.theme_label')}>
          {NK_THEMES.map((t) => (
            <ThemeCard key={t} theme={t} mode={mode} active={t === theme} />
          ))}
        </div>
      </section>

      <section className="nb-appearance__section">
        <h2 className="nb-appearance__h">{intl.get('nbooks.appearance.mode_label')}</h2>
        <div className="nb-appearance__segmented" role="radiogroup" aria-label={intl.get('nbooks.appearance.mode_label')}>
          {(['light', 'dark'] as NkMode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              className={mode === m ? 'is-active' : ''}
              onClick={() => setNkMode(m)}
              data-testid={`nb-mode-${m}`}
            >
              {intl.get(m === 'light' ? 'nbooks.appearance.mode_light' : 'nbooks.appearance.mode_dark')}
            </button>
          ))}
        </div>
        <p className="nb-appearance__help">{intl.get('nbooks.appearance.saved_note')}</p>
      </section>
    </div>
  );
}

export const PreferencesAppearance = FF.pipe(PreferencesAppearanceInner, withDashboardActions);
