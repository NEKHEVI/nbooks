import classNames from 'classnames';

interface NbBrandProps {
  className?: string;
}

/** Symbole harfang NEKHEVI : version fond clair ou fond sombre selon le mode (CSS). */
export function NbMark({ className }: NbBrandProps) {
  return (
    <>
      <img
        className={classNames(className, 'nb-logo-light')}
        src="/nbooks/nbooks-symbole-fond-clair.svg"
        alt=""
      />
      <img
        className={classNames(className, 'nb-logo-dark')}
        src="/nbooks/nbooks-symbole-fond-sombre.svg"
        alt=""
      />
    </>
  );
}

/** Marque NBooks du menu latéral : symbole + mot « NBooks » + « NEKHEVI ». */
export function NbBrand({ className }: NbBrandProps) {
  return (
    <div className={classNames('nb-brand', className)} aria-label="NBooks">
      <NbMark className="nb-brand__mark" />
      <div>
        <div className="nb-brand__word">
          <b>N</b>Books
        </div>
        <div className="nb-brand__sub">NEKHEVI</div>
      </div>
    </div>
  );
}

/** Marque NBooks centrée : connexion, chargement, erreurs. */
export function NbAuthLogo({ className }: NbBrandProps) {
  return (
    <div className={classNames('nb-auth-logo', className)} aria-label="NBooks">
      <NbMark className="nb-auth-logo__mark" />
      <div className="nb-auth-logo__word">
        <b>N</b>Books
      </div>
      <div className="nb-auth-logo__sub">NEKHEVI</div>
    </div>
  );
}
