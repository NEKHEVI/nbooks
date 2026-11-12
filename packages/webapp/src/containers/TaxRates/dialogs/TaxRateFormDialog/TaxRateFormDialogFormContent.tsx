import { Checkbox, Tag, Text } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import { ChangeEvent } from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { useTaxRateFormDialogContext } from './TaxRateFormDialogBoot';
import {
  TaxRateFormValues,
  transformTaxRateCodeValue,
  useIsTaxRateChanged,
} from './utils';
import { FCheckbox, FFormGroup, FInputGroup, Hint } from '@/components';
import { useTaxRates } from '@/hooks/query/tax-rates';

/**
 * Tax rate form content.
 * @returns {JSX.Element}
 */
export function TaxRateFormDialogContent() {
  const { values } = useFormikContext<TaxRateFormValues>();

  return (
    <div>
      <FFormGroup
        name={'name'}
        label={intl.get('rb_tax.form.name')}
        labelInfo={<Tag minimal>{intl.get('rb_tax.form.required')}</Tag>}
        subLabel={intl.get('rb_tax.form.name_sub')}
        fastField={true}
      >
        <FInputGroup name={'name'} fastField={true} />
      </FFormGroup>

      <TaxRateCodeField />
      <TaxGroupFields />

      {!values.isGroup && (
        <FFormGroup
          name={'rate'}
          label={intl.get('rb_tax.form.rate')}
          labelInfo={<Tag minimal>{intl.get('rb_tax.form.required')}</Tag>}
          fastField={true}
        >
          <RateFormGroup
            name={'rate'}
            rightElement={<Tag minimal>%</Tag>}
            fill={false}
            fastField={true}
          />
        </FFormGroup>
      )}

      <FFormGroup
        name={'description'}
        label={intl.get('rb_tax.form.description')}
        labelInfo={
          <Hint content="This description is for internal use only and will not be visiable to your customers." />
        }
        fastField={true}
      >
        <FInputGroup name={'description'} fastField={true} />
      </FFormGroup>

      <CompoundFormGroup name={'isCompound'} fastField={true}>
        <FCheckbox
          label={intl.get('rb_tax.form.is_compound')}
          name={'isCompound'}
          fastField={true}
        />
      </CompoundFormGroup>

      <CompoundFormGroup name={'isNonRecoverable'} fastField={true}>
        <FCheckbox
          label={intl.get('rb_tax.form.is_non_recoverable')}
          name={'isNonRecoverable'}
          fastField={true}
        />
      </CompoundFormGroup>

      <ConfirmEditingTaxRate />
    </div>
  );
}

/**
 * Tax rate code input group
 * @returns {JSX.Element}
 */
function TaxRateCodeField() {
  const { setFieldValue } = useFormikContext<TaxRateFormValues>();

  // Handle the field change.
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const transformedValue = transformTaxRateCodeValue(event.target.value);
    setFieldValue('code', transformedValue);
  };

  return (
    <FFormGroup
      name={'code'}
      label={intl.get('rb_tax.form.code')}
      labelInfo={<Tag minimal>{intl.get('rb_tax.form.required')}</Tag>}
      fastField={true}
    >
      <FInputGroup name={'code'} fastField={true} onChange={handleChange} />
    </FFormGroup>
  );
}

const sumRates = (list: any[], ids: number[]) =>
  Math.round(
    list
      .filter((t) => ids.includes(Number(t.id)))
      .reduce((sum, t) => sum + Number(t.rate), 0) * 100000,
  ) / 100000;

/**
 * RBooks : case « Groupe » et choix des taxes composantes (ex. TPS + TVQ).
 * Le serveur recalcule le taux du groupe (somme des composantes).
 */
function TaxGroupFields() {
  const { values, setFieldValue } = useFormikContext<TaxRateFormValues>();
  const { isNewMode } = useTaxRateFormDialogContext();
  const { data } = useTaxRates();

  const raw: any = data;
  const list: any[] = Array.isArray(raw)
    ? raw
    : (raw?.taxRates ?? raw?.data ?? []);
  const candidates = list.filter(
    (t) => t.active !== false && !t.isGroup && !t.is_group,
  );
  const selected = (values.componentIds || []).map(Number);
  const groupRate = sumRates(candidates, selected);

  const toggle = (id: number) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    setFieldValue('componentIds', next);
    setFieldValue('rate', String(sumRates(candidates, next)));
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <Checkbox
        data-testid="tax-rate-is-group"
        label={intl.get('rb_tax.form.is_group')}
        checked={!!values.isGroup}
        disabled={!isNewMode}
        onChange={(e) => {
          const checked = (e.target as HTMLInputElement).checked;
          setFieldValue('isGroup', checked);
          if (!checked) setFieldValue('componentIds', []);
          else setFieldValue('rate', String(groupRate || 0));
        }}
      />
      {values.isGroup && (
        <div style={{ marginLeft: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {intl.get('rb_tax.form.components')}
          </div>
          {candidates.map((t) => (
            <Checkbox
              key={t.id}
              disabled={!isNewMode}
              label={t.name + ' [' + t.rate + '%]'}
              checked={selected.includes(Number(t.id))}
              onChange={() => toggle(Number(t.id))}
              style={{ marginBottom: 2 }}
            />
          ))}
          <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>
            {intl.get('rb_tax.form.components_hint')}
          </div>
          <div style={{ marginTop: 4 }}>
            {intl.get('rb_tax.form.group_rate')} : <b>{groupRate} %</b>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmEditingTaxRate() {
  const isTaxRateChanged = useIsTaxRateChanged();
  const { isNewMode } = useTaxRateFormDialogContext();

  // Can't continue if it is new mode or tax rate not changed.
  if (!isTaxRateChanged || isNewMode) return null;

  return (
    <EditWarningWrap>
      <Text color={'#766f58'}>Please Note:</Text>
      <ConfirmEditFormGroup name={'confirmEdit'} helperText={''}>
        <FCheckbox
          name={'confirmEdit'}
          label={`I understand that updating the
          tax will mark the existing tax inactive, create a new tax, and update
          it in the chosen transactions.`}
        />
      </ConfirmEditFormGroup>
    </EditWarningWrap>
  );
}

const RateFormGroup = styled(FInputGroup)`
  max-width: 100px;
`;

const CompoundFormGroup = styled(FFormGroup)`
  margin-bottom: 0;
`;

const EditWarningWrap = styled(`div`)`
  background: #fcf8ec;
  margin-left: -20px;
  margin-right: -20px;
  padding: 14px 20px;
  font-size: 13px;
  margin-top: 8px;
  border-top: 1px solid #f2eddf;
  border-bottom: 1px solid #f2eddf;
`;

const ConfirmEditFormGroup = styled(FFormGroup)`
  margin-bottom: 0;
`;
