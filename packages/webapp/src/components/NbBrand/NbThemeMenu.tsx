import { Button, Classes, Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { Popover2 } from '@blueprintjs/popover2';
import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import {
  NK_THEMES,
  NK_THEME_EVENT,
  getNkMode,
  getNkTheme,
  setNkMode,
  setNkTheme,
} from '@/theme/nkTheme';

/** Barre du haut : choix rapide du thème NEKHEVI et du mode clair / sombre. */
export function NbThemeMenu() {
  const history = useHistory();
  const [state, setState] = useState(() => ({ theme: getNkTheme(), mode: getNkMode() }));

  useEffect(() => {
    const onChange = () => setState({ theme: getNkTheme(), mode: getNkMode() });
    window.addEventListener(NK_THEME_EVENT, onChange);
    return () => window.removeEventListener(NK_THEME_EVENT, onChange);
  }, []);

  return (
    <Popover2
      placement="bottom-end"
      content={
        <Menu data-testid="nb-theme-menu">
          {NK_THEMES.map((t) => (
            <MenuItem
              key={t}
              text={intl.get(`nbooks.theme.${t}.name`)}
              icon={state.theme === t ? 'tick' : 'blank'}
              active={state.theme === t}
              onClick={() => setNkTheme(t)}
            />
          ))}
          <MenuDivider />
          <MenuItem
            text={intl.get('nbooks.appearance.mode_light')}
            icon={state.mode === 'light' ? 'tick' : 'blank'}
            onClick={() => setNkMode('light')}
          />
          <MenuItem
            text={intl.get('nbooks.appearance.mode_dark')}
            icon={state.mode === 'dark' ? 'tick' : 'blank'}
            onClick={() => setNkMode('dark')}
          />
          <MenuDivider />
          <MenuItem
            text={intl.get('nbooks.appearance.title')}
            icon="cog"
            onClick={() => history.push('/preferences/appearance')}
          />
        </Menu>
      }
    >
      <Button
        className={Classes.MINIMAL}
        icon="contrast"
        aria-label={intl.get('nbooks.appearance.title')}
        title={intl.get('nbooks.appearance.title')}
        data-testid="nb-theme-button"
      />
    </Popover2>
  );
}
