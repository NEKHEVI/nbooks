import React from 'react';
import { AccountsPayableSection } from './AccountsPayableSection';
import { AccountsReceivableSection } from './AccountsReceivableSection';
import { FinancialAccountingSection } from './FinancialAccountingSection';
import { ProductsServicesSection } from './ProductsServicesSection';
import { NbInstrumentPanel } from './NbInstrumentPanel';
import '@/style/pages/HomePage/HomePage.scss';

export function HomepageContent() {
  return (
    <>
      <NbInstrumentPanel />
      <div className="financial-reports">
        <AccountsReceivableSection />
        <AccountsPayableSection />
        <FinancialAccountingSection />
        <ProductsServicesSection />
      </div>
    </>
  );
}
