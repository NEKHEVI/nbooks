export const initialValues = {
  templateName: '',

  // Colors
  primaryColor: '#BB8221', // NBooks : or NEKHEVI foncé (lisible sur papier blanc)
  secondaryColor: '#0B0B0C',

  // Company logo.
  showCompanyLogo: true,
  companyLogoKey: '',
  companyLogoUri: '',

  // Receipt Number
  showReceiptNumber: true,
  receiptNumberLabel: 'Receipt number',

  // Receipt Date
  showReceiptDate: true,
  receiptDateLabel: 'Date of Issue',

  // Customer address
  showCustomerAddress: true,

  // Company address
  showCompanyAddress: true,
  billedToLabel: 'Billed To',

  // Entries
  lineItemLabel: 'Item',
  lineRateLabel: 'Rate',
  lineTotalLabel: 'Total',

  // Subtotal
  showSubtotal: true,
  subtotalLabel: 'Subtotal',

  // Total
  showTotal: true,
  totalLabel: 'Total',

  // Terms & Conditions
  termsConditionsLabel: 'Terms & Conditions',
  showTermsConditions: true,

  // Customer Note
  customerNoteLabel: 'Customer Note',
  showCustomerNote: true,
};

export const fieldsGroups = [
  {
    label: 'Header',
    fields: [
      {
        labelKey: 'receiptNumberLabel',
        enableKey: 'showReceiptNumber',
        label: 'Receipt Number',
      },
      {
        labelKey: 'receiptDateLabel',
        enableKey: 'showReceiptDate',
        label: 'Receipt Date',
      },
      {
        enableKey: 'showCustomerAddress',
        labelKey: 'billedToLabel',
        label: 'Bill To',
      },
      {
        enableKey: 'showCompanyAddress',
        label: 'Billed From',
      },
    ],
  },
  {
    label: 'Totals',
    fields: [
      {
        labelKey: 'subtotalLabel',
        enableKey: 'showSubtotal',
        label: 'Subtotal',
      },
      { labelKey: 'totalLabel', enableKey: 'showTotal', label: 'Total' },
    ],
  },
  {
    label: 'Statements',
    fields: [
      {
        enableKey: 'showCustomerNote',
        labelKey: 'customerNoteLabel',
        label: 'Customer Note',
      },
      {
        enableKey: 'showTermsConditions',
        labelKey: 'termsConditionsLabel',
        label: 'Terms & Conditions',
      },
    ],
  },
];
