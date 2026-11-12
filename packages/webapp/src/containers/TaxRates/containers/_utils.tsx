import { Intent, Tag, Classes } from '@blueprintjs/core';
import clsx from 'classnames';
import intl from 'react-intl-universal';
import type { TaxRate } from '@bigcapital/sdk-ts';
import { Align } from '@/constants';

const codeAccessor = (taxRate: TaxRate) => {
  return (
    <Tag minimal={true} round={false} intent={Intent.NONE} interactive={true}>
      {taxRate.code}
    </Tag>
  );
};

const statusAccessor = (taxRate: TaxRate) => {
  return taxRate.active ? (
    <Tag round={false} intent={Intent.SUCCESS}>
      {intl.get('rb_tax.active')}
    </Tag>
  ) : (
    <Tag round={false} intent={Intent.NONE}>
      {intl.get('rb_tax.inactive')}
    </Tag>
  );
};

const nameAccessor = (taxRate: TaxRate) => {
  return (
    <>
      <span>{taxRate.name}</span>
      {!!taxRate.isCompound && (
        <span className={clsx(Classes.TEXT_MUTED)}>
          {intl.get('rb_tax.compound')}
        </span>
      )}
      {!!(taxRate as any).isGroup && (
        <span className={clsx(Classes.TEXT_MUTED)}>
          {' '}
          {intl.get('rb_tax.group_tag')}
        </span>
      )}
    </>
  );
};

const DescriptionAccessor = (taxRate: TaxRate) => {
  return (
    <span className={clsx(Classes.TEXT_MUTED)}>{taxRate.description}</span>
  );
};

/**
 * Retrieves the tax rates table columns.
 */
export const useTaxRatesTableColumns = () => {
  return [
    {
      Header: intl.get('rb_tax.col.name'),
      accessor: nameAccessor,
      width: 60,
    },
    {
      Header: intl.get('rb_tax.col.code'),
      accessor: codeAccessor,
      width: 40,
    },
    {
      Header: intl.get('rb_tax.col.rate'),
      accessor: 'rateFormatted',
      align: Align.Right,
      width: 30,
    },
    {
      Header: intl.get('rb_tax.col.description'),
      accessor: DescriptionAccessor,
      width: 100,
    },
    {
      Header: intl.get('rb_tax.col.status'),
      accessor: statusAccessor,
      width: 30,
      align: Align.Right,
    },
  ];
};
