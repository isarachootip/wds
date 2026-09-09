import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { CustomerOnboardingView } from './components/CustomerOnboardingView';
import { PricingCalculatorView } from './components/PricingCalculatorView';
import { InventoryFefoView } from './components/InventoryFefoView';
import { CreditDeskView } from './components/CreditDeskView';
import { TaxInvoiceView } from './components/TaxInvoiceView';

export const App: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('onboarding');

  return (
    <Layout selectedTab={selectedTab} onSelectTab={setSelectedTab}>
      {selectedTab === 'onboarding' && <CustomerOnboardingView />}
      {selectedTab === 'pricing' && <PricingCalculatorView />}
      {selectedTab === 'inventory' && <InventoryFefoView />}
      {selectedTab === 'credit' && <CreditDeskView />}
      {selectedTab === 'tax' && <TaxInvoiceView />}
    </Layout>
  );
};

export default App;
