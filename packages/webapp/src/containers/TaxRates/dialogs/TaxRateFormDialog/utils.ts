import { useFormikContext } from 'formik';
import type { TaxRate } from '@bigcapital/sdk-ts';
import { transformToForm } from '@/utils';

export interface TaxRateFormValues {
  name: string;
  code: string;
  rate: string;
  description: string;
  isCompound: boolean;
  isNonRecoverable: boolean;
  isGroup: boolean;
  componentIds: number[];
  confirmEdit: boolean;
}

export interface TaxRateFormRequestBody {
  name: string;
  code: string;
  rate: number;
  description: string;
  isCompound: boolean;
  isNonRecoverable: boolean;
  isGroup: boolean;
  componentIds?: number[];
  active: boolean;
}

// Default initial form values.
export const defaultInitialValues: TaxRateFormValues = {
  name: '',
  code: '',
  rate: '',
  description: '',
  isCompound: false,
  isNonRecoverable: false,
  isGroup: false,
  componentIds: [],
  confirmEdit: false,
};

/**
 * Transformers response errors to form errors.
 * @returns {Record<string, string>}
 */
export const transformApiErrors = (
  errors: Array<{ type?: string }>,
): Record<string, string> => {
  const fields: Record<string, string> = {};

  if (errors.find((e) => e.type === 'TAX_CODE_NOT_UNIQUE')) {
    fields.code = 'The tax rate is not unique.';
  }
  return fields;
};

/**
 * Tranformes form values to request values.
 */
export const transformFormToReq = (
  form: TaxRateFormValues,
): TaxRateFormRequestBody => {
  return {
    name: form.name,
    code: form.code,
    rate: Number(form.rate),
    description: form.description,
    isCompound: form.isCompound,
    isNonRecoverable: form.isNonRecoverable,
    isGroup: !!form.isGroup,
    componentIds: form.isGroup
      ? (form.componentIds || []).map(Number)
      : undefined,
    active: true,
  };
};

/**
 * Detarmines whether the tax rate changed.
 * @param initialValues
 * @param formValues
 * @returns {boolean}
 */
export const isTaxRateChange = (
  initialValues: TaxRateFormValues,
  formValues: TaxRateFormValues,
): boolean => {
  return initialValues.rate !== formValues.rate;
};

/**
 * Detarmines whether the tax rate changed.
 * @returns {boolean}
 */
export const useIsTaxRateChanged = (): boolean => {
  const { initialValues, values } = useFormikContext<TaxRateFormValues>();

  return isTaxRateChange(initialValues, values);
};

const parseComponentIds = (value: unknown): number[] => {
  if (Array.isArray(value)) return value.map(Number);
  if (typeof value === 'string' && value) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

const convertFormAttrsToBoolean = (
  form: TaxRateFormValues,
): TaxRateFormValues => {
  return {
    ...form,
    isCompound: !!form.isCompound,
    isNonRecoverable: !!form.isNonRecoverable,
    isGroup: !!form.isGroup,
    componentIds: parseComponentIds(form.componentIds),
  };
};

export const transformTaxRateToForm = (
  taxRate?: TaxRate,
): TaxRateFormValues => {
  return convertFormAttrsToBoolean({
    ...defaultInitialValues,
    ...transformToForm(taxRate, defaultInitialValues),
    rate:
      taxRate?.rate != null ? String(taxRate.rate) : defaultInitialValues.rate,
  });
};

export const transformTaxRateCodeValue = (input: string): string => {
  // Remove non-alphanumeric characters and spaces using a regular expression
  const cleanedString = input.replace(/\s+/g, '');

  // Convert the cleaned string to uppercase
  const uppercasedString = cleanedString.toUpperCase();

  return uppercasedString;
};
