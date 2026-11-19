import classNames from 'classnames';
import React from 'react';
import { NbAuthLogo } from '@/components/NbBrand/NbBrand';

import '@/style/components/BigcapitalLoading.scss';

interface BigcapitalLoadingProps {
  className?: string;
}

/**
 * Bigcapital logo loading.
 */
export default function BigcapitalLoading({
  className,
}: BigcapitalLoadingProps) {
  return (
    <div className={classNames('bigcapital-loading', className)}>
      <div className="center">
        <NbAuthLogo />
      </div>
    </div>
  );
}
