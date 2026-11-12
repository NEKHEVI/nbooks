import classNames from 'classnames';

interface RawlfBrandProps {
  className?: string;
}

/** Marque RAWLF (tuile noire + mot RAWLF + sous-titre RBooks), menu lateral. */
export function RawlfBrand({ className }: RawlfBrandProps) {
  return (
    <div className={classNames('rawlf-brand', className)}>
      <div className="rawlf-brand__tile">
        <img src="/rawlf-logo.png" alt="" />
      </div>
      <div>
        <div className="rawlf-brand__word">RAWLF</div>
        <div className="rawlf-brand__sub">RBooks</div>
      </div>
    </div>
  );
}

/** Marque RAWLF centree, ecrans de connexion et de chargement. */
export function RawlfAuthLogo({ className }: RawlfBrandProps) {
  return (
    <div className={classNames('rawlf-auth__logo', className)}>
      <div className="rawlf-auth__tile">
        <img src="/rawlf-logo.png" alt="" />
      </div>
      <div className="rawlf-auth__word">RAWLF</div>
      <div className="rawlf-auth__sub">RBooks</div>
    </div>
  );
}
