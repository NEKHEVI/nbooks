import classNames from 'classnames';
import React from 'react';
import { RawlfAuthLogo } from '@/components/RawlfBrand/RawlfBrand';

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
        <RawlfAuthLogo />
      </div>
    </div>
  );
}
