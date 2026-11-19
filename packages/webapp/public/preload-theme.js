// NBooks : thème et mode posés avant le premier rendu (aucun flash).
// Thème d'habillage (editorial | instrument | verre | bento) : clé « nk-theme », défaut instrument.
// Mode clair / sombre : clé « theme » (light | dark), défaut sombre comme l'app NEKHEVI.
var NK_THEMES = ['editorial', 'instrument', 'verre', 'bento'];

function nbRead(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

var nkTheme = nbRead('nk-theme');
if (NK_THEMES.indexOf(nkTheme) === -1) nkTheme = 'instrument';
document.documentElement.setAttribute('data-nk-theme', nkTheme);

var theme = nbRead('theme') || 'dark';

// Pages publiques de paiement : toujours en clair (comme Bigcapital).
if (window.location.pathname.startsWith('/payment')) theme = 'light';

if (theme === 'dark') {
  document.documentElement.classList.add('bp4-dark');
  if (document.body) document.body.classList.add('bp4-dark');
  else
    document.addEventListener('DOMContentLoaded', function () {
      document.body.classList.add('bp4-dark');
    });
}
