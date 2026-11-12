import intl from 'react-intl-universal';

export const getLanguages = (): Array<{ name: string; value: string }> => [
  { name: intl.get('english'), value: 'en' },
  { name: 'Français', value: 'fr' },
];
